import {hostname} from 'os';

class ServerContext {
  constructor() {
    // Initialize default settings
    this.tlsOptions = {};
    this.greeting = hostname();
    this.maxMessageSize = 10 * 1024 * 1024;
    this.logLevel = 'INFO';
    // Default hooks
    this.onConnect = () => {};
    this.onDisconnect = () => {};
    this.onEHLO = async () => true;
    this.onMAILFROM = async () => true;
    this.onRCPTTO = async () => true;
    this.onSecure = async () => true;
    this.onDATA = async () => true;
  }

  // Method to set options, allowing for overrides by the implementing project
  setOptions(options = {}) {
    Object.assign(this, options)
   }
}

// Export a singleton instance of the context
export default new ServerContext();
