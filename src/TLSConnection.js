import tls from 'tls';
import Logger from './utils/logger.js';
import context from './ServerContext.js';

export function handleTLSConnection(session) {
  // Create a new TLS socket from the existing socket
  const {tlsOptions,eventEmitter} = context;

  const tlsSocket = new tls.TLSSocket(session.socket, {
    isServer: true,
    ...tlsOptions,
  });

  tlsSocket.once('connect', () => {
    console.log('TLS socket connect event triggered.');
  });

  // Set up event listeners for the TLS socket
  tlsSocket.on('data', (data) => {
    if(session.state !== session.states.DATA_READY) {
      const message = data.toString().trim();
      Logger.debug(`C: ${message}`, session.id);

      // Emit a generic command event on the secure channel
      eventEmitter.emit('command', message, session);
    }
  });

  tlsSocket.on('end', () => {
    context.onDisconnect(session);
    Logger.info('Client disconnected', session.id);


  });

  tlsSocket.on('_tlsError', (err) => {
    switch (err.code) {
      case 'ERR_SSL_UNSUPPORTED_PROTOCOL':
        Logger.warn(`No shared TLS versions`, session.id);
        break;
      case 'ERR_SSL_NO_SHARED_CIPHER':
        Logger.warn(`No shared TLS ciphers`, session.id);
        break;
      default:
        Logger.warn(err.message, session.id);
        break;
    }
  });

  tlsSocket.on('secure', () => {

    // Replace the plain socket with the secure TLS socket
    session.socket = tlsSocket;

    // Set TLS connection data
    session.tls = {
      enabled: true,
      version: tlsSocket.getProtocol(),  // Get the TLS protocol version
      cipher: tlsSocket.getCipher().standardName,     // Get the cipher info (now it will be defined)
      authorized: tlsSocket.getPeerCertificate() || false,  // Check if the connection is authorized
    };

    Logger.info(
        `Connection upgraded to ${session.tls.version} (${session.tls.cipher})`,
        session.id);
    context.onSecure(session);
  });

  // Transition to TLS state
  session.transitionTo(session.states.STARTTLS);
}
