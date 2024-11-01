import Response from '../models/Response.js';
import context from '../core/ServerContext.js';

let commandHandlers = {};
let unhandledCommands = ['HELO', 'RSET', 'VRFY', 'EXPN', 'HELP', 'NOOP'];

export function registerCommand(command, handler) {
  commandHandlers[command.toUpperCase()] = handler;
}

/**
 * Interprets and routes commands.
 *
 * @module CommandHandler
 * @param {String} message - Retrieved message line
 * @param {Session} session - Session sending the command
 * @returns {Promise<void>}
 * @async
 */
export async function handleCommand(message, session) {
  const command = message.split(' ')[0].toUpperCase();
  const args = message.substring(command.length + 1).split(' ');
  const handler = commandHandlers[command];
  if (handler) {
    await handler(args, session);
  } else {
    session.unknownCommands += 1;
    if (session.unknownCommands < context.maxUnknownCommands) {
      if (unhandledCommands.includes(command)) {
        session.send(new Response('Command not implemented', 502, [5, 5, 1]));
      } else {
        session.send(new Response('Unknown command', 500, [5, 5, 2]));
      }
    } else {
      session.send(new Response('Too many unknown commands.', 421, [4, 7, 0]));
      session.socket.destroySoon();
    }
  }
}
