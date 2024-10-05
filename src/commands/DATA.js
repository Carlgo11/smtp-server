import context from '../ServerContext.js';

/**
 * Handles the SMTP DATA command.
 *
 * @param {string} message - The received command message.
 * @param {SMTPSession} session - The current SMTP session.
 * @param {net.Server} server - The SMTP server instance.
 */
export default function DATA(message, session, server) {
  // Constants
  const DATA_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
  const MAX_MESSAGE_SIZE = context.max_message_size; // 10 MB
  let dataBuffer = '';
  let dataTimeout;

  /**
   * Resets the timeout for receiving data.
   */
  const resetTimeout = () => {
    clearTimeout(dataTimeout);
    dataTimeout = setTimeout(() => {
      session.send('Requested action aborted: timeout', [451, 4, 4, 2]);
      cleanup(false);
    }, DATA_TIMEOUT);
  };

  /**
   * Cleans up event listeners and resets state after data reception is complete.
   */
  const cleanup = (result) => {
    clearTimeout(dataTimeout);
    server.removeListener('dataChunk', onDataChunk);

    // Transition to DATA_DONE state after processing is complete
    session.transitionTo(result ? session.states.DATA_DONE : session.states.RCPT_TO);
  };

  /**
   * Handles the completion of the data message.
   *
   * @param {string} messageData - The complete message data received.
   */
  const handleDataComplete = (messageData) => {
      // Pass the message data to the consumer's onDATA handler
      context.onDATA(messageData, session).then(result => {
        session.send('Message accepted', [250, 2, 6, 0]);
        cleanup(true);
      }).catch((result) => {
        session.send(`${result || 'Message rejected'}`, [550, 5, 1, 0]);
        cleanup(false);
      })
  };

  /**
   * Processes each chunk of data received during the DATA phase.
   *
   * @param {Buffer} chunk - The data chunk received.
   */
  const onDataChunk = (chunk) => {
    resetTimeout();
    dataBuffer += chunk.toString();

    // Check for maximum message size
    if (dataBuffer.length > MAX_MESSAGE_SIZE) {
      session.send('Message size exceeds fixed maximum message size', [552, 5, 3, 4]);
      cleanup(false);
      return;
    }

    // Look for end-of-data sequence
    const endSequenceIndex = dataBuffer.indexOf('\r\n.\r\n');
    if (endSequenceIndex !== -1) {
      // Extract the message data up to the end sequence
      const messageData = dataBuffer.substring(0, endSequenceIndex);

      // Remove dot-stuffing (replace '\r\n..' with '\r\n.')
      const processedData = messageData.replace(/\r\n\.\./g, '\r\n.');

      handleDataComplete(processedData);
    }
  };

  // Ensure the state allows the transition to DATA
  if (session.state !== session.states.RCPT_TO) {
    session.send('Bad sequence of commands', [503, 5, 5, 1]);
    return;
  }

  // Transition to DATA_READY state and prompt client to start sending data
  session.transitionTo(session.states.DATA_READY);
  session.send('Start mail input; end with <CRLF>.<CRLF>', [354, 2, 0, 0]);

  // Start the data reception timeout
  resetTimeout();

  // Attach listener for 'dataChunk' event
  server.on('dataChunk', onDataChunk);
}
