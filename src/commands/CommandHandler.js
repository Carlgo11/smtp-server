import EHLO from './EHLO.js';
import STARTTLS from './STARTTLS.js';
import MAIL from './MAIL.js';
import QUIT from './QUIT.js';

export default function handleCommands(eventEmitter, context) {
  eventEmitter.on('command', (message, session) => {
    const command = message.trim().split(' ')[0].toLowerCase();
    switch (command) {
      case 'ehlo':
        EHLO(message, session, context);
        break;
      case 'starttls':
        STARTTLS(message, session, context);
        break;
      case 'mail':
        MAIL(message,session, context);
        break;
      case 'data':
        break;
      case 'quit':
        QUIT(session);
        break;
      default:
        session.send(`Command unrecognized ${command}`, 500);
        break;
    }
  });
}