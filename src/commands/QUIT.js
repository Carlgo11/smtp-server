export default function QUIT(session){
  session.send('BYE', 221);
  session.socket.end();
}