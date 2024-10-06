import net from 'net';
import SMTPSession from './SMTPSession.js';
import Logger from './utils/logger.js';
import {registerCommand, handleCommand} from './commands/CommandHandler.js';
import context from './ServerContext.js';
import _Response from './model/Response.js';

// Load commands
import EHLO from './commands/EHLO.js';
import STARTTLS from './commands/STARTTLS.js';
import QUIT from './commands/QUIT.js';
import MAIL from './commands/MAIL.js';
import RCPT from './commands/RCPT.js';
import DATA from './commands/DATA.js';

registerCommand('EHLO', EHLO);
registerCommand('STARTTLS', STARTTLS);
registerCommand('MAIL', MAIL);
registerCommand('RCPT', RCPT);
registerCommand('DATA', DATA);
registerCommand('QUIT', QUIT);

export function startSMTPServer(options = {}) {

  // Create a shared context for all configurations and handlers
  context.setOptions(options);

  // Create the SMTP server
  const server = net.createServer((socket) => {
    const session = new SMTPSession(socket);

    context.onConnect(session);

    Logger.info(`${session.rDNS || session.clientIP}:${socket.remotePort} connected over ${socket.remoteFamily}`, session.id);

    // Greet the client
    session.send(`${session.greeting} ESMTP`, 220);

    // Handle incoming data
    socket.on('data', (data) => {
      const message = data.toString().trim();
      Logger.debug(`C: ${message}`, session.id);

      handleCommand(message, session, server);
    });

    socket.on('end', () => {
      context.onDisconnect(session);
      Logger.info('Client disconnected', session.id)
    });

    socket.on('error', (err) => {
      console.error(`Error occurred with ${session.clientIP}: ${err.message}`);
    });

    server.on('terminate', () => {
      terminate();
    });

    const terminate = () => {
      server.close();
      context.onDisconnect(session);
      socket.write('421 4.4.2 Server shutting down\r\n', () => {
        socket.end();
      });
    }

    process.on('SIGINT', () => server.emit('terminate'));
    process.on('SIGTERM', () => server.emit('terminate'));
  });

  return server; // Return the server instance for further use
}

export const Response = _Response
