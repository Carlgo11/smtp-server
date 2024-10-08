import {handleTLSConnection} from '../core/TLSServer.js';
import Logger from '../utils/Logger.js';
import Response from '../models/Response.js';

export default async function STARTTLS(_, session, server) {
  // Ensure that STARTTLS can only be initiated after EHLO
  if (session.state !== session.states.EHLO_RECEIVED)
    return session.send(new Response(null, 503, [5, 5, 1]));

  // Send response to indicate server is ready to start TLS
  session.socket.write('220 Ready to start TLS\r\n', async () => {
    Logger.debug('Initiating TLS negotiations', session.id);
    // Once the response is flushed, immediately upgrade to TLS
    await handleTLSConnection(session, server);
  });
}
