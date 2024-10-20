import context from '../core/ServerContext.js';

const levels = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const colors = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m', // Green
  WARN: '\x1b[33m', // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m', // Reset color
};

/**
 * Logger
 *
 * @example Logger.info('This message will be printed in the console');
 * @class Logger
 * @module Logger
 * @param {{ERROR: string, INFO: string, DEBUG: string, WARN: string}} level - Log level
 */
class Logger {
  constructor(level) {
    this.level = level;
  }

  /**
   * Set log level
   *
   * @param {{ERROR: string, INFO: string, DEBUG: string, WARN: string}} newLevel - New log level
   */
  setLevel(newLevel) {
    this.level = newLevel;
  }

  // Utility method to format the log message
  formatMessage(level, message, sessionID) {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    const session = sessionID ? ` <${sessionID}> ` : ' ';

    return `${colors[level]}[${level}]${colors.RESET} ${' '.repeat(5 - level.length)}[${time}]${session}${message}`;
  }

  log(level, message, sessionID) {
    if (this.shouldLog(level)) {
      console.log(this.formatMessage(level, message, sessionID));
    }
  }

  /**
   * Log a new message as logLevel DEBUG
   *
   * @param {String} message Message to send.
   * @param {String} sessionID - ID of the session. (optional)
   */
  debug(message, sessionID = null) {
    this.log(levels.DEBUG, message, sessionID);
  }

  /**
   * Log a new message as Log level INFO
   *
   * @param {String} message Message to send.
   * @param {String} sessionID - ID of the session. (optional)
   */
  info(message, sessionID = null) {
    this.log(levels.INFO, message, sessionID);
  }

  /**
   * Log a new message as Log level WARN
   *
   * @param {String} message Message to send.
   * @param {String} sessionID - ID of the session. (optional)
   */
  warn(message, sessionID = null) {
    this.log(levels.WARN, message, sessionID);
  }

  /**
   * Log a new message as Log level ERROR
   *
   * @param {String} message Message to send.
   * @param {String} sessionID - ID of the session. (optional)
   */
  error(message, sessionID = null) {
    this.log(levels.ERROR, message, sessionID);
  }

  // Determine if the current level should be logged based on set log level
  shouldLog(level) {
    const levelPriority = {
      [levels.DEBUG]: 1,
      [levels.INFO]: 2,
      [levels.WARN]: 3,
      [levels.ERROR]: 4,
    };

    return levelPriority[level] >= levelPriority[this.level];
  }
}

// Singleton logger instance with default level INFO
const logger = new Logger(context.logLevel);

export default logger;
