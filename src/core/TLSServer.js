import tls from 'tls';
import Logger from '../utils/Logger.js';
import context from './ServerContext.js';
import events from './Event.js';
import { handleCommand } from '../commands/CommandHandler.js';

/**
 * Set up TLS connection with socket
 *
 * @param {Session} session - Session to upgrade to TLS
 * @module TLSServer
 */
export function handleTLSConnection(session) {
  // Create a new TLS socket from the existing socket
  const { tlsOptions } = context;

  const tlsSocket = new tls.TLSSocket(session.socket, {
    isServer: true,
    ...tlsOptions,
  });

  let commandBuffer = '';
  const commandQueue = [];
  let processing = false;

  // Handle incoming data from the client
  tlsSocket.on('data', async (data) => {
    // If in DATA_READY state, emit the data as message body content
    if (session.state === session.states.DATA_READY)
      /**
       * New IMF message data received from client.
       *
       * @event DATA
       * @param {String} data - The message contents.
       * @param {Session} session - The session sending the data.
       */
      events.emit('DATA', data, session);
    else {
      // Accumulate data in the buffer for command processing
      commandBuffer += data.toString();

      // Split buffer into complete commands by CRLF
      const lines = commandBuffer.split('\r\n');
      commandBuffer = lines.pop(); // Store any incomplete command back in the buffer

      // Add complete commands to the queue
      commandQueue.push(...lines);

      // Process the command queue
      await processCommandQueue();
    }
  });

  // Process commands sequentially from the command queue
  async function processCommandQueue() {
    if (processing) return; // Exit if another command is being processed
    processing = true; // Mark processing state

    while (commandQueue.length > 0) {
      const command = commandQueue.shift().trim(); // Dequeue the next command

      // Skip empty lines (possible with consecutive CRLF)
      if (command.length === 0) continue;

      Logger.debug(`C: ${command}`, session.id);

      // Enforce the maximum command line length (RFC 5321 Section 4.5.3.1.5)
      if (command.length > 512) {
        session.send(new Response('Line too long', 500, [5, 5, 2]));
        break;
      }

      try {
        // Handle the command and wait for it to finish
        await handleCommand(command, session);

        // After handleCommand, check if the state has changed to DATA_READY
        if (session.state === session.states.DATA_READY) {
          // Once in DATA_READY state, stop processing commands
          // The next data chunks will be emitted to the parser
          break;
        }
      } catch (err) {
        Logger.error(`Command processing error: ${err.message}`, session.id);
        session.send(new Response('Internal server error', 451, [4, 0, 0]));
        break;
      }
    }

    processing = false;
  }

  tlsSocket.on('end', () => {
    context.onDisconnect(session);
    events.emit('DISCONNECT', session);
    Logger.info('Client disconnected', session.id);
  });

  tlsSocket.on('_tlsError', (err) => {
    switch (err.code) {
      case 'ERR_SSL_UNSUPPORTED_PROTOCOL':
        Logger.warn(
          `No shared TLS versions (Client wants ${tlsSocket.getProtocol()})`,
          session.id
        );
        break;
      case 'ERR_SSL_NO_SHARED_CIPHER':
        Logger.warn('No shared TLS ciphers.', session.id);
        break;
      default:
        Logger.warn(err.message, session.id);
        break;
    }
  });

  tlsSocket.on('secure', () => {
    // Replace the plain socket with the secure TLS socket
    session.socket = tlsSocket;

    const protocol = tlsSocket.getProtocol();
    const cipher = tlsSocket.getCipher().standardName;

    // Set TLS connection data
    session.tls = {
      enabled: true,
      version: protocol, // Get the TLS protocol version
      cipher, // Get the cipher info (now it will be defined)
    };

    Logger.info(`Connection upgraded to ${protocol} (${cipher})`, session.id);
    /**
     * Connection upgraded to TLS socket
     *
     * @event SECURE
     * @param {Session} session - Session being upgraded.
     */
    events.emit('SECURE', session);
    context.onSecure(session).then((r) => r);
  });

  tlsSocket.on('terminate', () => {
    context.onDisconnect(session);
    session.send(new Response('Server shutting down', 421, [4, 4, 2]));
    tlsSocket.end();
  });

  process.on('SIGINT', () => tlsSocket.emit('terminate'));
  process.on('SIGTERM', () => tlsSocket.emit('terminate'));

  // Transition to TLS state
  session.transitionTo(session.states.STARTTLS);
}
