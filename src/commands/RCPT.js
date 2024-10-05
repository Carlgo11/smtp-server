import context from '../ServerContext.js';

export default function RCPT(args, session, server) {
  if (session.state !== session.states.MAIL_FROM) {
    return session.send('503 Bad sequence of commands', 503);
  }

  // Validate command is MAIL FROM:
  if (args.length !== 1 || !args[0].toUpperCase().startsWith('TO:')) {
    return session.send('Syntax error in parameters or arguments', 501);
  }

  // Parse the `RCPT TO` command
  const address = args[0].toLowerCase().slice(3);

  // Ensure correct command format
  if (!address.startsWith('<') || !address.endsWith('>')) {
    return session.send('Syntax error in parameters or arguments', 501);
  }
  const recipient = address.slice(1, -1); // Extract the email address

  server.emit('RCPT', session, recipient);

  context.onRCPTTO(recipient, session).then(result => {
    // Save the recipient's address in the session
    session.rcptTo.push(recipient);

    // Transition to RCPT_TO state
    session.transitionTo(session.states.RCPT_TO);

    // Send positive response
    session.send(new Response(null, 250, [2, 1, 5]));
  }).catch(err => err ? session.send(err):session.send('Bad address', 518));
}
