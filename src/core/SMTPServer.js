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
import RSET from '../commands/RSET.js';
import DATA from '../commands/DATA.js';

const activeSessions = new Set();

registerCommand('EHLO', EHLO);
registerCommand('STARTTLS', STARTTLS);
registerCommand('MAIL', MAIL);
registerCommand('RCPT', RCPT);
registerCommand('RSET', RSET);
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

    reverseDNS(session.clientIP, 0).then(ip => {
      session.rDNS = ip;
    });

    Log.setLevel(context.logLevel);
    const rDNS = `<${await reverseDNS(session.clientIP, 1000)}>`;
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
      session.transitionTo(session.states.GREETING_DONE);
    }).catch((err) => {
      // Check if socket is still open
      if (socket.destroyed || !activeSessions.has(session.id)) return undefined;

      activeSessions.delete(session.id);
      Log.info(`${session.clientIP} disconnected`, session.id);

      if (err instanceof Response)
        socket.write(`${err.toString()}\r\n`, () => socket.destroySoon());
      else
        socket.write('421 Connection refused\r\n', () => socket.destroySoon());
    });

    // Handle incoming data
    socket.on('data', (data) => {
      const message = data.toString().trim();

      if(/^[\x00-\x7F]*$/.test(message) === false) {
        Log.debug(`C: ${data.toString('hex')}`, session.id);
        Log.warn(`${session.clientIP} sent invalid characters.`, session.id);
        return session.send('Protocol error: invalid characters', 501);
      }

      Log.debug(`C: ${message}`, session.id);

      if(session.state === session.states.NEW){
        Log.warn(`${session.clientIP} talked too soon.`, session.id);
        session.send('Protocol error: premature data', 554);
        return socket.destroySoon();
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
        session.id,
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
      session.socket.destroySoon();
      activeSessions.delete(session);
    }
  };

  server.maxConnections = context.maxConnections;
  Listen.setMaxListeners(1024);

  process.on('SIGINT', handleTermination);
  process.on('SIGTERM', handleTermination);
  process.setMaxListeners(1024);

  return server; // Return the server instance for further use
}
