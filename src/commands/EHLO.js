import context from '../core/ServerContext.js';
import events from '../core/Event.js';
import Response from '../models/Response.js';
import isValidEHLO from '../utils/ValidEHLO.js';

export default function EHLO(args, session) {
  if (session.state !== 'GREETING_DONE' && session.state !== 'STARTTLS')
    return session.send(new Response(null, 503, [5, 5, 1]));

  if (args.length !== 1)
    return session.send(new Response(null, 501, [5, 5, 2]));

  const domain = args[0];

  if (!isValidEHLO(domain))
    return session.send(new Response(null, 501, [5, 5, 2]));

  /**
   * New EHLO value received from client.
   *
   * @event EHLO
   * @param {Session} session - Session sending the command
   * @param {String} domain - Value of the EHLO command
   */
  events.emit('EHLO', session, domain);

  // Wait for external validation
  context.onEHLO(domain, session).then((result) => {
    if (result instanceof Response) return session.send(result);

    session.ehlo = domain;
    session.send(`250-${context.greeting} Hello, ${domain}`);
    const { extensions } = context;

    if (session.tls) {
      extensions.forEach((extension) =>
        session.send(`250-${extension.toUpperCase()}`),
      );
      session.send(`250 SIZE ${context.maxMessageSize}`);
      session.estatus = extensions.includes('ENHANCEDSTATUSCODES');
    } else {
      session.send('250 STARTTLS');
      session.transitionTo(session.states.EHLO_RECEIVED);
    }

    // Provide last EHLO state for RSET command
    session.lastEhloState = session.state;

  }).catch((err) =>
    session.send(
      err instanceof Response ? err:new Response(null, 451, [4, 3, 0]),
    ),
  );
}
