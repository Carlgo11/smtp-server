# **SMTP Server**

**A customizable and lightweight SMTP server designed for efficient email handling and extensibility. Built with modularity in mind, this server allows developers to easily integrate custom behavior through event-driven architecture, enabling seamless customization, whether it's for a small-scale personal project or a large-scale production environment.**

### **Why Choose This SMTP Server?**

- **Highly Customizable**: Easily add your own business logic at different stages of the SMTP session. From filtering emails based on sender addresses to validating content before accepting the message, the callback system makes customization intuitive and powerful.

- **Event-Driven Architecture**: Built on top of Node.js’s event model, this server emits events for each SMTP command, providing hooks to control and respond to every aspect of email handling, enabling advanced features like throttling, logging, and monitoring.

- **Lightweight and Efficient**: Designed with performance in mind, the server is capable of handling multiple clients concurrently without heavy resource usage. By using async/await for non-blocking I/O, it ensures that each connection is processed quickly and efficiently.

- **Secure by Default**: With built-in support for secure (TLS) connections, you can enforce `STARTTLS` and other security policies to ensure that emails are transmitted safely over the network. The server is designed to be compatible with modern security practices.

- **Enhanced Status Code Support**: Provides support for RFC-compliant enhanced status codes, making it easier to diagnose and handle issues related to email delivery.

- **Developer-Friendly**: Comes with comprehensive examples and detailed documentation to help you quickly set up the server, understand how it works, and start customizing it for your specific needs. Whether you’re developing a new email processing system, integrating with an existing application, or learning about SMTP, this server makes it easy.

### **Who is This For?**

This SMTP server is perfect for:
- **Developers Building Custom Email Solutions**: If you need complete control over how emails are processed, validated, and routed.
- **Security-Conscious Applications**: Where validating senders, enforcing policies, and controlling the flow of messages is a critical requirement.
- **Learning and Experimentation**: Provides a great playground for those looking to learn about the internals of SMTP, email protocols, and secure communication.

### **How It Works**

The server begins by listening for incoming SMTP connections and provides hooks (callbacks) that allow you to manage the session. You have full control over each stage:
- **Connection Management**: You can handle new client connections, enforce connection limits, and decide how to respond based on the client's IP address or behavior.
- **SMTP Commands**: Customize how each command—like `EHLO`, `MAIL FROM`, `RCPT TO`, `DATA`—is processed. You can validate the content, enforce policies, or even reject messages based on specific conditions.
- **Secure Connections**: The server supports `STARTTLS`, allowing clients to upgrade their connection to a secure one. You can choose whether to require or enforce TLS.

## **Getting Started**

### **Prerequisites**
- **Node.js**: Ensure that you have Node.js installed on your machine (>=20.x recommended).
- **npm/yarn**: Use npm or yarn for package management.

### **Installation**
1. **Install smtp-server**
   ```bash
   npm install @carlgo11/smtp-server
   ```
2. **Set up a script to call SMTPServer**  
   See [Example](#Example).

## **Usage**

To integrate this SMTP server into your project, you can start the server and listen to various events to handle the email flow.

### **Example**
```js
import SMTPServer from '@carlgo11/smtp-server';

// Create server instance
const server = new SMTPServer({
  port: 25,
  tlsOptions: {
    key: 'key.pem',
    cert: 'cert.pem',
  },
});

// Define event handlers
server.onConnect((session) => {
  console.log(`Client connected: ${session.clientIP}`);
});

server.onEHLO((address, session) => {
  console.log(`EHLO received from: ${address}`);
});

// Other hooks or event handlers...
```

## **Hooks and Event Flow**

The SMTP server provides several hooks (callbacks) that you can implement to manage different stages of an SMTP session. Each callback corresponds to a specific phase of the email transfer process:

### **Hooks**

Hooks (callbacks) offer you to intervene during an event (such as EHLO) and pass or reject a client's request.
The downside to this is that the server will freeze the conversation with the client until your code returns.
All hooks support Promises (async/await).

| Hook Name      | Arguments        | Description                                              |
|----------------|------------------|----------------------------------------------------------|
| `onConnect`    | session          | Triggered when a client connects to the server.          |
| `onDisconnect` | session          | Triggered when a client disconnects from the server.     |
| `onEHLO`       | address, session | Triggered when the server receives the `EHLO` command.   |
| `onSecure`     | session          | Triggered when a client initiates a STARTTLS connection. |
| `onMAILFROM`   | address, session | Triggered when the `MAIL FROM` command is issued.        |
| `onRCPTTO`     | address, session | Triggered when the `RCPT TO` command is issued.          |
| `onDATA`       | message, session | Triggered when the `DATA` phase begins.                  |
|
#### **Handling Connections with Hooks**

Here's a basic example of handling an incoming email:

```js
server.onMAILFROM((address, session) => {
  // Validate the sender's address
  if (address.includes('blacklisted.com')) {
    session.send('Sender address rejected', [550, 5, 7, 1]);
    return false;
  }
  session.send('OK', [250, 2, 1, 0]);
  return true;
});

server.onRCPTTO(async (address, session) => {
  // Check if recipient is allowed
   const allowed = await isAllowedRecipient(address);
  if (!allowed) {
    const error = new Error('Recipient address rejected');
    error.responseCode = 550;
    throw error;
  }
  return true;
});
```

### **Events**

Using events allows you to parse session events without freezing the client-server conversation.
This is useful if you don't expect to reject a message, but just parse and store it.

| Event Name   | Arguments          | Description                                        |
|--------------|--------------------|----------------------------------------------------|
| `connect`    | session            | Emitted when a client connects.                    |
| `disconnect` | session            | Emitted when a client disconnects.                 | 
| `secure`     | session            | Emitted when a STARTTLS connection is established. |
| `command`    | session, message   | Emitted for every incoming command.                |
| `EHLO`       | session, domain    | Emitted when `EHLO` command is received.           |
| `MAIL`       | session, address   | Emitted when `MAIL FROM` command is received.      |
| `RCPT`       | session, address   | Emitted when `RCPT TO` command is received.        |
| `dataChunk`  | dataChunk, session | Emitted when the message data is received.         |

#### **Handling Connections with Events**

```js
server.on('connect', (session) => {
  console.log(`${session.clientIP} connected.`);
});

server.on('MAIL', (session, address) => {
  console.log(`${session.id} set sender address to ${address}`);
});
```

## **Configuration**

The server supports customization by passing options directly to the server constructor. Below are some common configuration options:

- **`port`**: (Number) The port on which the server should listen (default is `25`).
- **`tlsOptions`**: (Object) Options for TLS setup. Allowed values are the [TLSSocket options](https://nodejs.org/api/tls.html#class-tlstlssocket).
- **`maxMessageSize`**: (Number) Maximum allowed size of an email message.
- **`greeting`**: (String) The greeting part of SMTP status codes. (default is the computer hostname).

## **Logging**

By default, the server provides basic logging of connections, disconnections, and commands received. You can enhance the logging by listening to events and writing custom log handlers.

## **Contributing**

Contributions are welcome! If you'd like to contribute:
1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes and open a pull request with a description of the changes.

## **License**

This project is licensed under the GPLv3 License. See the [LICENSE](./LICENSE) file for more information.
 