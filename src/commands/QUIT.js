import Response from '../model/Response.js';
export default function QUIT(session) {
  session.send(new Response('BYE', 221, [2, 0, 0]));
  session.socket.end();
}