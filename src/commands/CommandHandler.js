import EHLO from './EHLO.js';
import STARTTLS from './STARTTLS.js';
import MAIL from './MAIL.js';
import QUIT from './QUIT.js';
import DATA from './DATA.js';

export default function handleCommands(eventEmitter) {
  eventEmitter.on('command', (message, session) => {
    const command = message.trim().split(' ')[0].toUpperCase();
    switch (command) {
      case 'EHLO':
        EHLO(message, session);
        break;
      case 'STARTTLS':
        STARTTLS(message, session);
        break;
      case 'MAIL':
        MAIL(message, session);
        break;
      case 'RCPT':
        break;
      case 'DATA':
        DATA(message, session);
        break;
      case 'QUIT':
        QUIT(session);
        break;
      default:
        session.send(`Command unrecognized ${command}`, 502);
        break;
    }
  });
}