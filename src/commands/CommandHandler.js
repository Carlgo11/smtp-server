import Response from '../model/Response.js';

let commandHandlers = {};

export function registerCommand(command, handler) {
  commandHandlers[command.toUpperCase()] = handler;
}

export function clearCommands() {
  commandHandlers = {};
}

export function handleCommand(message, session, server) {
  const command = message.trim().split(' ')[0].toUpperCase();
  const args = message.trim().substring(command.length).split(' ');
  const handler = commandHandlers[command];

  handler ?
      handler(args, session, server):
      session.send(new Response('Command not implemented', 502, [5, 5, 1]));
}
