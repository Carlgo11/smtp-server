import context from '../core/ServerContext.js';
import Response from '../models/Response.js';
import events from '../core/Event.js';

export default async function MAIL(args, session) {
  if (session.state !== session.states.STARTTLS)
    return session.send(
      session.tls
        ? new Response(null, 501, [5, 5, 1])
        : new Response('Must issue a STARTTLS command first.', 530, [5, 7, 0])
    );

  // Validate command is MAIL FROM:
  if (!args[0].toUpperCase().startsWith('FROM:'))
    return session.send(new Response(null, 501, [5, 5, 2]));

  // Parse the `MAIL FROM` command
  const address = args[0].toLowerCase().slice(5);

  // Ensure correct command format
  if (!address.startsWith('<') || !address.endsWith('>'))
    return session.send(new Response(null, 501, [5, 5, 2]));

  // Extract the email address
  const sender = address.slice(1, -1);

  events.emit('MAIL', session, sender);

  const [_, ...extensions] = args;

  // Wait on external validation
  context
    .onMAILFROM(sender, session, extensions)
    .then((result) => {
      // Save the sender's address in the session
      session.mailFrom = sender;

      // Transition to MAIL_FROM state
      session.transitionTo(session.states.MAIL_FROM);

      session.send(
        result instanceof Response
          ? result
          : new Response(`Originator <${sender}> ok`, 250, [2, 1, 0])
      );
    })
    .catch((err) =>
      session.send(
        err instanceof Response ? err : new Response(null, 451, [4, 3, 0])
      )
    );
}
