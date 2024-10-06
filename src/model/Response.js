const statuses = {
  '4.3.0': 'Requested action aborted: local error in processing',
  '5.3.0': 'Transaction failed: internal server error',
  '2.0.0': 'OK',
  '2.1.0': 'OK',
  '2.1.5': 'Destination address valid',
  '5.5.1': 'Bad sequence of commands',
  '5.5.2': 'Syntax error',
};

/**
 * SMTP Response
 *
 * @param String message - Message to send
 * @param int basicStatus - SMTP basic status code
 * @param number[] enhancedStatus - SMTP Enhanced status code
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

  toString(eStatusCodes = true) {
    const eStatus = this.enhancedStatus.join('.');
    return `${this.basicStatus}${eStatusCodes ? ` ${eStatus}`: ''} ${this.message}`;
  }

  fetchMessage(enhancedStatus) {
    return statuses[enhancedStatus.join('.')] ||
        statuses[enhancedStatus.slice(1).join('.')];
  }
}