export default function QUIT(session){
  session.send('Bye', 250);
  session.socket.end();
}