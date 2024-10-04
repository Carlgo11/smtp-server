import context from '../ServerContext.js';
export default async function MAIL(message, session) {
  if (session.state !== session.states.RCPT_TO) {
    return session.send('503 Bad sequence of commands', 503);
  }

  // Validate command is MAIL FROM:
  if(!message.toUpperCase().startsWith('MAIL FROM:')) {
    return session.send('Syntax error in parameters or arguments', 501);
  }

  // Parse the `MAIL FROM` command
  const address = message.toLowerCase().slice(10);
  console.log(address);
  console.log('starts', address.startsWith('<'));
  console.log('ends', address.endsWith('>'));
  // Ensure correct command format
  if (!address.startsWith('<') || !address.endsWith('>')) {
    return session.send('Syntax error in parameters or arguments', 501);
  }

  const sender = address.slice(1).slice(0,1); // Extract the email address

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
