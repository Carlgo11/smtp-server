// MAIL.js

export default function MAIL(message, session) {
  if (session.state !== session.states.STARTTLS) {
    return session.send('503 Bad sequence of commands', 503);
  }

  // Parse the `MAIL FROM` command
  const args = message.split(' ');

  // Ensure correct command format
  if (args.length < 2 || args[1].toUpperCase() !== 'FROM:' || !args[2] || !args[2].startsWith('<') || !args[2].endsWith('>')) {
    return session.send('Syntax error in parameters or arguments', 501);
  }

  const sender = args.slice(1).join(' ').split(':')[1].trim(); // Extract the email address

  // Validate email address format
  if (!validateEmail(sender)) {
    return session.send('Invalid email address format', 501);
  }

  // Save the sender's address in the session
  session.mailFrom = sender;

  // Transition to MAIL_FROM state
  session.transitionTo(session.states.MAIL_FROM);

  // Send positive response
  session.send('OK', 250);
}

// Helper function to validate email format
function validateEmail(address) {
  // Basic regex for validating email address format
  const emailRegex = /^<[^@]+@[^@]+\.[^@]+>$/;
  return emailRegex.test(address);
}
