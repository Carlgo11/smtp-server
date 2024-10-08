import Response from '../models/Response.js';
import context from '../core/ServerContext.js';

let commandHandlers = {};

export function registerCommand(command, handler) {
  commandHandlers[command.toUpperCase()] = handler;
}

export function clearCommands() {
  commandHandlers = {};
}

export function handleCommand(message, session) {
  const command = message.trim().split(' ')[0].toUpperCase();
  const args = message.substring(command.length).trim().split(' ');
  const handler = commandHandlers[command];

  if (handler) {
    handler(args, session);
  } else {
    session.unknownCommands += 1;
    if (session.unknownCommands < context.maxUnknownCommands)
      session.send(new Response('Command not implemented', 502, [5, 5, 1]));
    else {
      session.send(new Response('Too many unknown commands.', 421, [4, 7, 0]));
      session.socket.end();
    }
  }
}
