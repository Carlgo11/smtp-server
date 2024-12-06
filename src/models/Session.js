import { randomBytes } from 'node:crypto';
import Logger from '../utils/Logger.js';
import Response from './Response.js';

/**
 * Represents an SMTP session, handling client interactions and maintaining session state.
 *
 * @class Session
 * @module Session
 * @param {net.Socket} socket - The socket representing the client connection.
 * @property {string} id - Unique session ID.
 * @property {string} clientIP - The IP address of the client.
 * @property {string} [rDNS] - The reverse DNS lookup result for the client's IP.
 * @property {string} state - The current state of the SMTP session (e.g., CONNECTED, DATA_READY).
 */
export default class Session {
  constructor(socket) {
    this.socket = socket;
    this.clientIP = socket.remoteAddress.startsWith('::ffff:')
      ? socket.remoteAddress.slice(7)
      :socket.remoteAddress;
    this.id = randomBytes(8).toString('hex');
    this.rDNS = null;
    this.utf8 = false;
    this.ehlo = null;
    this.lastEhloState = 'GREETING_DONE';
    this.unknownCommands = 0;
    this.mailFrom = null;
    this.rcptTo = [];
    this.tls = false; // TLS session info placeholder
    this.estatus = false;

    // Define session states
    this.states = {
      NEW: 'NEW', // Just connected
      GREETING_DONE: 'GREETING_DONE', // Greeting complete
      EHLO_RECEIVED: 'EHLO_RECEIVED', // EHLO completed
      STARTTLS: 'STARTTLS', // STARTTLS completed
      MAIL_FROM: 'MAIL_FROM', // MAIL FROM received
      RCPT_TO: 'RCPT_TO', // RCPT TO received
      DATA_READY: 'DATA_READY', // Data received
      DATA_DONE: 'DATA_DONE', // Data received
    };

    this.state = this.states.NEW; // Start with the NEW state
  }

  /**
   * Send a message to the client
   *
   * @param {String|Response} message - Message to send
   * @param code {Number|undefined} - Status code
   */
  send(message, code = undefined) {
    let output = '';
    if (message instanceof Response)
      output = message.toString(this.estatus);
    else if (code === undefined)
      output = message;
    else if (Number.isInteger(code))
      output = `${code} ${message}`;

    Logger.debug(`S: ${output}`, this.id);
    this.socket.write(`${output}\r\n`);
  }

  /**
   * Transition to a new session state
   *
   * @param {String} newState - New state to transition to
   */
  transitionTo(newState) {
    Logger.debug(`Session transitioned to ${newState}`, this.id);
    this.state = newState;
  }
}
