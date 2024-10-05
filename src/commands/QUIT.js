export default function QUIT(session) {
  session.send('BYE', [221, 2, 0, 0]);
  session.socket.end();
}