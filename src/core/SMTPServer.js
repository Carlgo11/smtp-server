import net from 'net';
import Session from '../models/Session.js';
import Log from '../utils/Logger.js';
import reverseDNS from '../utils/reverseDNS.js';
import { handleCommand, registerCommand } from '../commands/CommandHandler.js';
import context from './ServerContext.js';
import Listen from './Event.js';
import Response from '../models/Response.js';

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

/**
 * Create an SMTP server
 *
 * @extends net.Server
 * @param {Object} options - Settings passed on
 * @returns {Server} - Returns Net Server.
 * @class SMTPServer
 * @module SMTPServer
 */
export default function startSMTPServer(options = {}) {
  // Create a shared context for all configurations and handlers
  context.setOptions(options);

  // Create the SMTP server
  const server = net.createServer(async (socket) => {
    const session = new Session(socket);
    socket.setTimeout(context.timeout);

    // Add session to active sessions
    activeSessions.add(session);
    session.rDNS = await reverseDNS(session.clientIP);
    Log.setLevel(context.logLevel);
    const rDNS = `<${session.rDNS}>`;
    Log.info(`${session.clientIP} connected ${rDNS}`, session.id);

    /**
     * New SMTP connection established.
     *
     * @event CONNECT
     * @param {Session} session - The session object of the connecting client.
     */
    Listen.emit('CONNECT', session);
    context.onConnect(session).then(() => {
      // Greet the client
      session.send(`${context.greeting} ESMTP`, 220);
    }).catch((err) => {
      if (err instanceof Response)
        socket.write(`${err.toString()}\r\n`, () => socket.end());
      else
        socket.write('421 Connection refused\r\n', () => socket.end());
    });

    // Handle incoming data
    socket.on('data', (data) => {
      const message = data.toString().trim();
      Log.debug(`C: ${message}`, session.id);

      if(data.toString().toUpperCase().includes('HTTP/1')){
        Log.warn(`${session.clientIP} sent an HTTP command`)
        return session.socket.end();
      }

      if (data.length > 512)
        session.send(new Response('Line too long', 500, [5, 5, 2]));
      else handleCommand(message, session);
    });

    socket.on('end', () => {
      context.onDisconnect(session);
      Log.info(`${session.clientIP} disconnected`, session.id);
      activeSessions.delete(session);
    });

    socket.on('error', (err) => {
      Log.error(
        `Error occurred with ${session.clientIP}: ${err.message}`,
        session.id
      );
      activeSessions.delete(session);
    });
  });

  // Handle termination signals outside the connection handler
  const handleTermination = () => {
    Log.info('Server is shutting down...');
    server.close(
      () => Log.info('Server closed, no longer accepting connections.'));

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
