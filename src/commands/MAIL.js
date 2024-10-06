import context from '../ServerContext.js';
import Response from '../model/Response.js';

export default async function MAIL(args, session, server) {
  if (session.state !== session.states.STARTTLS) {
    const res = session.tls ?
        new Response(null, 501, [5, 5, 1]):
        new Response('Must issue a STARTTLS command first.', 530, [5, 7, 0]);
    return session.send(res);
  }

  // Validate command is MAIL FROM:
  if (args.length !== 1 || !args[0].toUpperCase().startsWith('FROM:')) {
    return session.send(new Response(null, 501, [5, 5, 2]));
  }

  // Parse the `MAIL FROM` command
  const address = args[0].toLowerCase().slice(5);

  // Ensure correct command format
  if (!address.startsWith('<') || !address.endsWith('>')) {
    return session.send(new Response(null, 501, [5, 5, 2]));
  }

  const sender = address.slice(1, -1); // Extract the email address

  server.emit('MAIL', session, sender);

  // Wait on external validation
  context.onMAILFROM(sender).then(result => {
    // Save the sender's address in the session
    session.mailFrom = sender;

    // Transition to MAIL_FROM state
    session.transitionTo(session.states.MAIL_FROM);

    // Send positive response
    session.send(new Response(null, 250, [2, 1, 0]));
  }).catch(err => {
    if (err instanceof Response) session.send(err);
    else session.send(new Response(null, 451, [4, 3, 0]));
  });
}
