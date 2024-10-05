import context from '../ServerContext.js';
import Response from '../model/Response.js';

export default async function EHLO(args, session, server) {

  if (!session.isValidTransition(['NEW', 'STARTTLS']))
    return session.send(new Response(null, 503, [5,5,1]));

  if (args.length !== 1)
    return session.send(new Response(null, 501, [5,5,2]));

  const domain = args[0];

  server.emit('EHLO', session, domain);

  // Wait for external validation
  context.onEHLO(domain, session).then((result) => {
    if (result instanceof Response) {
      session.send(result);
    } else {
      session.ehlo = domain;
      session.send(`250-${session.greeting} Hello, ${domain}`);

      if (session.tls) {
        session.send('250-ENHANCEDSTATUSCODES');
        session.send(`SIZE ${context.maxMessageSize}`, 250);
      } else {
        session.send('STARTTLS', 250);
        session.transitionTo(session.states.EHLO_RECEIVED);
      }
    }
  }).catch((e) => {
    if (e instanceof Response) session.send(e);
    else session.send(new Response(null, 451, [4, 3, 0]));
  });
}
