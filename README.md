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
import {Server, Response} from '@carlgo11/smtp-server';

// Create server instance
const server = new Server({
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

//Start server on port 25
server.listen(25, null,() => {
   Logger.info(`SMTP Server listening on ${context.port}`);
});
```

## **Hooks and Event Flow**

- **Hooks**: Use when you need to validate, reject, or modify messages at specific stages (e.g., `onMAILFROM`, `onRCPTTO`).
   - Pros: Granular control, inline validation.
   - Cons: Freezes session while executing.
- **Events**: Use for monitoring, logging, or passive processing (e.g., `MAIL`, `DATA`).
   - Pros: Non-blocking, better for analytics.
   - Cons: Cannot reject/modify messages.

### **Hooks**

| Hook Name      | Arguments                    | Description                                                       |
|----------------|------------------------------|-------------------------------------------------------------------|
| `onConnect`    | session                      | Triggered when a client connects to the server.                   |
| `onDisconnect` | session                      | Triggered when a client disconnects from the server.              |
| `onEHLO`       | address, session             | Triggered when the server receives the `EHLO` command.            |
| `onSecure`     | session                      | Triggered when a client initiates a STARTTLS connection.          |
| `onMAILFROM`   | sender, session, esmtpParams | Triggered when the `MAIL FROM` command is issued.                 |
| `onRCPTTO`     | recipient, session           | Triggered when the `RCPT TO` command is issued.                   |
| `onDATA`       | messageData, session         | Triggered when the client has sent the entire email message (IMF) |

#### **Handling Connections with Hooks**

Here's a basic example of handling an incoming email:

```js
server.onMAILFROM((address, session) => {
  // Validate the sender's address
  if (address.includes('blacklisted.com')) {
    throw new Response('Sender address rejected', 550, [5, 7, 1]);
  }
  // You can return true if you want the server to send a default message.
  return true;
});

server.onRCPTTO(async (address, session) => {
  // Check if recipient is allowed
   const allowed = await isAllowedRecipient(address);
  if (!allowed) {
    throw new Repsonse('Recipient does not exist', 550, [5, 1, 1]);
  }
  // If you return a Response, the default message is overwritten
  return new Response('${address} OK', 250, [2, 1, 5]) 
});
```

### **Events**

| Event Name   | Arguments        | Description                                        |
|--------------|------------------|----------------------------------------------------|
| `CONNECT`    | session          | Emitted when a client connects.                    |
| `DISCONNECT` | session          | Emitted when a client disconnects.                 | 
| `SECURE`     | session          | Emitted when a STARTTLS connection is established. |
| `EHLO`       | session, domain  | Emitted when `EHLO` command is received.           |
| `MAIL`       | session, address | Emitted when `MAIL FROM` command is received.      |
| `RCPT`       | session, address | Emitted when `RCPT TO` command is received.        |
| `DATA`       | session, message | Emitted when an IMF data chunk is received.        |

#### **Handling Connections with Events**

```js
server.on('CONNECT', (session) => {
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

By default, the server provides basic logging of connections, disconnections, and commands received.
You can specify the intensity of the logs by changing the log level.
The following log levels are provided:
* DEBUG
* INFO
* WARN
* ERROR

The log level is specified when implementing the Server object.
```js
const server = new Server({
   logLevel: 'DEBUG',
}) 
```

If you wish to disable logging completely, set `logLevel` to `'NONE'`.

You can also send your own strings to log by implementing the `Logger` from the project.
```js
import {Logger} from '@carlgo11/smtp-server';

Logger.info('This message is sent as an INFO message.');

Logger.debug('And this message is sent as a DEBUG message.');
```

## **Contributing**

Contributions are welcome! If you'd like to contribute:
1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes and open a pull request with a description of the changes.

## **License**

This project is licensed under the GPLv3 License. See the [LICENSE](./LICENSE) file for more information.
 