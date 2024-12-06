import Response from '../models/Response.js';

export default function RSET(args, session) {

  session.transitionTo(session.lastEhloState);
  session.utf8 = false;
  session.mailFrom = null;
  session.rcptTo = [];

  session.send(new Response('OK', 220, [2, 0, 0]));
}