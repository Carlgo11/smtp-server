import Logger from '../utils/logger.js';

export default function EHLO(message, session, context) {

  if (!session.isValidTransition(['NEW', 'STARTTLS'])) {
    return session.send('503 Bad sequence of commands', 503);
  }

  const args = message.split(' ');
  if (args.length !== 2) {
    return session.send('Syntax error in parameters or arguments', 401);
  }

  const domain = args[1];

  session.ehlo = domain;
  session.socket.write(`250-${session.greeting} Hello, ${domain}\r\n`);
  Logger.debug(`S: 250-${session.greeting} Hello, ${domain}`, session.id);

  if (session.tls) {
    console.log(session.tls);
    session.send('SIZE 35882577', 250);
  } else {
    session.send('STARTTLS', 250);
    session.transitionTo(session.states.EHLO_RECEIVED);
  }
}

