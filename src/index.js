import net from 'net';
import {EventEmitter} from 'events';
import SMTPSession from './SMTPSession.js';
import Logger from './utils/logger.js';
import handleCommands from './commands/CommandHandler.js';
import context from './ServerContext.js';
import _Response from './model/Response.js';

export function startSMTPServer(options = {}) {

  // Create a shared context for all configurations and handlers
  context.setOptions(options);

  // Create the SMTP server
  const server = net.createServer((socket) => {
    const session = new SMTPSession(socket);

    // Initialize command handlers
    handleCommands(server);

    context.onConnect(session);

    Logger.info(`${session.rDNS || session.clientIP}:${socket.remotePort} connected over ${socket.remoteFamily}`, session.id);

    // Greet the client
    session.send(`${session.greeting} ESMTP`, 220);

    // Handle incoming data
    socket.on('data', (data) => {
      const message = data.toString().trim();
      Logger.debug(`C: ${message}`, session.id);

      // Emit a generic command event
      server.emit('command', message, session);
    });

    socket.on('end', () => {
      context.onDisconnect(session);
      Logger.info('Client disconnected', session.id)
    });

    socket.on('error', (err) => {
      console.error(`Error occurred with ${session.clientIP}: ${err.message}`);
    });

    server.on('terminate', () => {
      context.onDisconnect(session);
      session.send('Closing connection', 500);
      socket.end();
    });
  });



  return server; // Return the server instance for further use
}
export const Response = _Response

