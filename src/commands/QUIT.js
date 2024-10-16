import Response from '../models/Response.js';

export default function QUIT(_, session) {
  session.send(new Response('BYE', 221, [2, 0, 0]));
  session.socket.end();
}
