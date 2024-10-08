import net from 'net';
import Session from '../models/Session.js';
import _Response from '../models/Response.js';
import Logger from '../utils/Logger.js';
import reverseDNS from '../utils/reverseDNS.js';
import {handleCommand, registerCommand} from '../commands/CommandHandler.js';
import context from './ServerContext.js';
import events from './Event.js';

// Load commands
import EHLO from '../commands/EHLO.js';
import STARTTLS from '../commands/STARTTLS.js';
import QUIT from '../commands/QUIT.js';
import MAIL from '../commands/MAIL.js';
import RCPT from '../commands/RCPT.js';
import DATA from '../commands/DATA.js';

const activeSessions = new Set();

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
  const server = net.createServer(async (socket) => {
    const session = new Session(socket);

    // Add session to active sessions
    activeSessions.add(session);
    session.rDNS = await reverseDNS(session.clientIP);
    Logger.setLevel(context.logLevel)
    const rDNS = `<${session.rDNS}>`
    Logger.info(`${session.clientIP} connected ${rDNS}`, session.id);

    events.emit('CONNECT', session);
    context.onConnect(session);

    // Greet the client
    session.send(`${session.greeting} ESMTP`, 220);

    // Handle incoming data
    socket.on('data', (data) => {
      const message = data.toString().trim();
      Logger.debug(`C: ${message}`, session.id);
      handleCommand(message, session);
    });

    socket.on('end', () => {
      context.onDisconnect(session);
      Logger.info(`${session.clientIP} disconnected`, session.id);
      activeSessions.delete(session);
    });

    socket.on('error', (err) => {
      Logger.error(`Error occurred with ${session.clientIP}: ${err.message}`,
          session.id);
      activeSessions.delete(session);
    });
  });

  // Handle termination signals outside the connection handler
  const handleTermination = () => {
    Logger.info('Server is shutting down...');
    server.close(() => {
      Logger.info('Server closed, no longer accepting connections.');
    });

    // Gracefully close all active sessions
    for (const session of activeSessions) {
      session.send(new Response('Server shutting down', 421, [4, 4, 2]));
      session.socket.end();
      activeSessions.delete(session);
    }
  };

  process.on('SIGINT', handleTermination);
  process.on('SIGTERM', handleTermination);

  return server; // Return the server instance for further use
}

export const Response = _Response;
export const Listen = events;
export const Log = Logger;