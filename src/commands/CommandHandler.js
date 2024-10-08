import Response from '../models/Response.js';

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

  handler ?
      handler(args, session):
      session.send(new Response('Command not implemented', 502, [5, 5, 1]));
}
