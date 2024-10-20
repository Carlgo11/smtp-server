const statuses = {
  '4.1.1': 'Bad destination mailbox address',
  '4.3.0': 'Requested action aborted: local error in processing',
  '5.3.0': 'Transaction failed: internal server error',
  '2.0.0': 'OK',
  '2.1.0': 'OK',
  '2.1.5': 'Destination address valid',
  '5.5.1': 'Bad sequence of commands',
  '5.5.2': 'Syntax error',
};

/**
 * Creates an SMTP response message with the given status codes and message.
 *
 * @class Response
 * @module Response
 * @param {string} [message] - The response message to be sent to the client.
 * @param {number} basicStatus - The basic SMTP status code.
 * @param {number[]} enhancedStatus - Optional enhanced status codes.
 * @example
 * const res = new Response('OK', 250, [2, 0, 0]);
 * session.send(res);
 */
export default class Response {
  constructor(message, basicStatus = 250, enhancedStatus = [2, 0, 0]) {
    if (message === null) {
      message = this.fetchMessage(enhancedStatus);
      if (!message) throw new Error('Missing message');
    }
    this.message = message;
    this.basicStatus = basicStatus;
    this.enhancedStatus = enhancedStatus;
  }

  /**
   * Export the Response to a formatted string.
   *
   * @param {boolean} eStatusCodes - True if enhanced status codes should be included. False if only basic status codes should be used.
   * @returns {string} Returns formatted string.
   */
  toString(eStatusCodes = true) {
    const eStatus = this.enhancedStatus.join('.');
    return `${this.basicStatus}${eStatusCodes ?
      ` ${eStatus}`:
      ''} ${this.message}`;
  }

  /**
   * Fetch default message for an enhanced status code
   *
   * @param {Array} enhancedStatus Enhanced Status Code to fetch default message for.
   * @returns {String|null} Returns the message if found, otherwise null.
   */
  fetchMessage(enhancedStatus) {
    return (
      statuses[enhancedStatus.join('.')] ||
      statuses[enhancedStatus.slice(1).join('.')]
    );
  }
}
