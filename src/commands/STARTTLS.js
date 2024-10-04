import {handleTLSConnection} from '../TLSConnection.js';
import Logger from '../utils/logger.js';

export default function STARTTLS(message, session) {
  // Ensure that STARTTLS can only be initiated after EHLO
  if (session.state !== session.states.EHLO_RECEIVED) {
    return session.send('Bad sequence of commands', 503);
  }

  // Send response to indicate server is ready to start TLS
  session.socket.write('220 Ready to start TLS\r\n', () => {
    Logger.debug('Initiating TLS negotiations', session.id)
    // Once the response is flushed, immediately upgrade to TLS
    handleTLSConnection(session);
  });
}
