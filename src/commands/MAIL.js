import context from '../ServerContext.js';
export default async function MAIL(args, session, server) {
  if (session.state !== session.states.STARTTLS) {
    return session.send('503 Bad sequence of commands', 503);
  }

  // Validate command is MAIL FROM:
  if(args.length !== 1 || !args[0].toUpperCase().startsWith('FROM:')) {
    return session.send('Syntax error in parameters or arguments', 501);
  }

  // Parse the `MAIL FROM` command
  const address = args[0].toLowerCase().slice(5);

  // Ensure correct command format
  if (!address.startsWith('<') || !address.endsWith('>')) {
    return session.send('Syntax error in parameters or arguments', 501);
  }

  const sender = address.slice(1, -1); // Extract the email address

  server.emit('MAIL', session, sender);

  // Wait on external validation
  if(!await context.onMAILFROM(sender))
    return session.send('', 501)

  // Save the sender's address in the session
  session.mailFrom = sender;

  // Transition to MAIL_FROM state
  session.transitionTo(session.states.MAIL_FROM);

  // Send positive response
  session.send('OK', 250);
}
