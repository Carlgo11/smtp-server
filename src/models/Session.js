import os from 'os';
import * as crypto from 'node:crypto';
import Logger from '../utils/Logger.js';
import Response from './Response.js';

export default class Session {
  constructor(socket) {
    this.socket = socket;
    this.clientIP = socket.remoteAddress.startsWith('::ffff:') ?
        socket.remoteAddress.slice(7):
        socket.remoteAddress;
    this.greeting = os.hostname();
    this.id = crypto.randomBytes(8).toString('hex');
    this.rDNS = null;
    this.ehlo = null;
    this.unknownCommands = 0;
    this.mailFrom = null;
    this.rcptTo = [];
    this.tls = false; // TLS session info placeholder

    // Define session states
    this.states = {
      NEW: 'NEW',                     // Just connected
      EHLO_RECEIVED: 'EHLO_RECEIVED', // EHLO completed
      STARTTLS: 'STARTTLS',           // STARTTLS completed
      MAIL_FROM: 'MAIL_FROM',         // MAIL FROM received
      RCPT_TO: 'RCPT_TO',             // RCPT TO received
      DATA_READY: 'DATA_READY',       // Data received
      DATA_DONE: 'DATA_DONE',         // Data received
      QUIT: 'QUIT',                   // Client has quit
    };

    this.state = this.states.NEW; // Start with the NEW state
  }

  /**
   *
   * @param {String|Error|Response} message
   * @param code {Number|Array}
   */
  send(message, code = undefined) {
    let output = '';
    if (message instanceof Response) {
      output = message.toString(this.tls);
    } else if (message instanceof Error) {
      output = `${message.responseCode} ${message.message}`;
    } else if (code === undefined) {
      output = message;
    } else if (code instanceof Array) {
      const basic = code.shift();
      const enhanced = code.join('.');
      output = `${basic} ${enhanced} ${message}`;
    } else if (Number.isInteger(code)) {
      output = `${code} ${message}`;
    }
    Logger.debug(`S: ${output}`, this.id);
    this.socket.write(`${output}\r\n`);

  }

  // State transition helper
  transitionTo(newState) {
    Logger.debug(`Session transitioned to ${newState}`, this.id);
    this.state = newState;
  }

  // State validation helper
  isValidTransition(expectedState) {
    if (expectedState instanceof Array) {
      for (const state of expectedState) {
        if (this.state === state) return true;
      }
      return false;
    } else
      return this.state === expectedState;
  }
}
