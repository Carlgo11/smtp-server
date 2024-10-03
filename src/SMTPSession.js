import os from 'os';
import * as crypto from 'node:crypto';
import Logger from './utils/logger.js';

export default class SMTPSession {
  constructor(socket) {
    this.socket = socket;
    this.clientIP = socket.remoteAddress;
    this.greeting = os.hostname()
    this.id = crypto.randomBytes(8).toString('hex')
    this.rDNS = null;
    this.ehlo = null;
    this.mailFrom = null;
    this.rcptTo = [];
    this.tls = false; // TLS session info placeholder

    // Define session states
    this.states = {
      NEW: 'NEW',         // Just connected
      EHLO_RECEIVED: 'EHLO_RECEIVED', // EHLO completed
      STARTTLS: 'STARTTLS', // STARTTLS completed
      MAIL_FROM: 'MAIL_FROM',   // MAIL FROM received
      RCPT_TO: 'RCPT_TO',       // RCPT TO received
      DATA_READY: 'DATA_READY', // Ready to receive data
      QUIT: 'QUIT'        // Client has quit
    };

    this.state = this.states.NEW; // Start with the NEW state
  }

  send(message, code){
    Logger.debug(`S: ${code} ${message}`, this.id);
    this.socket.write(`${code} ${message}\r\n`);
  }

  // State transition helper
  transitionTo(newState) {
    Logger.debug(`Session transitioned to ${newState}`,this.id);
    this.state = newState;
  }

  // State validation helper
  isValidTransition(expectedState) {
    if(expectedState instanceof Array){
      for(const state of expectedState){
        if(this.state === state) return true;
      }
      return false;
    }else
    return this.state === expectedState;
  }
}
