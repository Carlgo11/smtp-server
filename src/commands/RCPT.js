import context from '../core/ServerContext.js';
import Response from '../models/Response.js';
import events from '../core/Event.js';

export default async function RCPT(args, session) {
  if (session.state !== session.states.MAIL_FROM)
    return session.send(new Response(null, 501, [5, 5, 1]));

  // Validate command is MAIL FROM:
  if (args.length !== 1 || !args[0].toUpperCase().startsWith('TO:'))
    return session.send('Syntax error in parameters or arguments', 501);

  // Parse the `RCPT TO` command
  const address = args[0].toLowerCase().slice(3);

  // Ensure correct command format
  if (!address.startsWith('<') || !address.endsWith('>'))
    return session.send('Syntax error in parameters or arguments', 501);

  // Extract the email address
  const recipient = address.slice(1, -1);

  events.emit('RCPT', session, recipient);

  return context.onRCPTTO(recipient, session).then((result) => {
    // Save the recipient's address in the session
    session.rcptTo.push(recipient);

    // Transition to RCPT_TO state
    session.transitionTo(session.states.RCPT_TO);

    // Send positive response
    session.send(result instanceof Response ?
        result:
        new Response(`Recipient <${recipient}> ok`, 250, [2, 1, 5]));
  }).catch(err => session.send(err instanceof Response ?
      err:
      new Response(null, 451, [4, 1, 1])));
}
