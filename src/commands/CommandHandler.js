import EHLO from './EHLO.js';
import STARTTLS from './STARTTLS.js';
import MAIL from './MAIL.js';
import QUIT from './QUIT.js';
import DATA from './DATA.js';

export default function handleCommands(server) {
  server.on('command', (message, session) => {
    const command = message.trim().split(' ')[0].toUpperCase();
    const args = message.substring(command.length).trim().split(' ');
    switch (command) {
      case 'EHLO':
        EHLO(args, session, server);
        break;
      case 'STARTTLS':
        STARTTLS(session, server);
        break;
      case 'MAIL':
        MAIL(args, session, server);
        break;
      case 'RCPT':
        break;
      case 'DATA':
        DATA(args, session);
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