import context from '../ServerContext.js';

export default async function EHLO(message, session) {

  if (!session.isValidTransition(['NEW', 'STARTTLS']))
    return session.send('Bad sequence of commands', 503);

  const args = message.split(' ');
  if (args.length !== 2)
    return session.send('Syntax error in parameters or arguments', 401);

  const domain = args[1];

  // Wait for external validation
  context.onEHLO(domain, session).then(() => {
    session.ehlo = domain;
    session.send(`250-${session.greeting} Hello, ${domain}`);

    if (session.tls) {
      session.send('250-ENHANCEDSTATUSCODES');
      session.send('SIZE 35882577', 250);
    } else {
      session.send('STARTTLS', 250);
      session.transitionTo(session.states.EHLO_RECEIVED);
    }
  }).catch((e) => {
    session.send(e);
  })
}
