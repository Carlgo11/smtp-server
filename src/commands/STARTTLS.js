import {handleTLSConnection} from '../TLSConnection.js';
import Logger from '../utils/logger.js';
import Response from '../model/Response.js';

export default function STARTTLS(session,server) {
  // Ensure that STARTTLS can only be initiated after EHLO
  if (session.state !== session.states.EHLO_RECEIVED) {
    return session.send(new Response(null, 503, [5,5,1]));
  }

  // Send response to indicate server is ready to start TLS
  session.socket.write('220 Ready to start TLS\r\n', () => {
    Logger.debug('Initiating TLS negotiations', session.id)
    // Once the response is flushed, immediately upgrade to TLS
    handleTLSConnection(session,server);
  });
}
