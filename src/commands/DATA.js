import context from '../ServerContext.js';

export default async function DATA(message, session) {
  // Ensure the state allows the transition to DATA
  if (!session.isValidTransition(session.states.RCPT_TO)) {
    return session.send('Bad sequence of commands', 503);
  }

  // Change session state to receiving data
  session.transitionTo(session.states.DATA_READY);

  // Prompt client to start sending message data
  session.send('Start mail input; end with <CRLF>.<CRLF>', 354);

  // Prepare to collect data from the client
  let dataBuffer = '';

  // Listen for data chunks from the client
  session.socket.on('data', (chunk) => {
    const data = chunk.toString();

    // Check if message ends with <CRLF>.<CRLF> indicating the end of message data
    if (data.endsWith('\r\n.\r\n')) {
      // Append the chunk without the ending dot terminator
      dataBuffer += data.slice(0, -5);

      // Transition to next state
      session.transitionTo(session.states.QUIT);

      // Handle the end of the data message
      handleDataComplete(dataBuffer, session);
    } else {
      // Continue appending data
      dataBuffer += data;
    }
  });

  // Handle completion of the data message
  async function handleDataComplete(messageData, session) {
    try {
      // Pass the message data to the consumer's onMessageReceived handler
      const result = await context.onDATA(messageData, session);

      // If the handler approves the message
      if (result === true) {
        session.send('OK', 250); // Accept the message
      } else {
        session.send(`${result || 'Message rejected'}`, 550); // Reject the message
      }
      session.transitionTo(session.states.DATA_DONE);
    } catch (error) {
      // Handle any errors during message processing
      session.send('Requested action aborted: local error in processing', 451);
    }
  }
}
