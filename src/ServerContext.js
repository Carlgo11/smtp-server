import {hostname} from 'os';

class ServerContext {
  constructor() {
    // Initialize default settings
    this.tlsOptions = {};
    this.greeting = hostname();
    this.maxMessageSize = 10 * 1024 * 1024;
    this.logLevel = 'INFO';
    this.onConnect = (session) => {};
    this.onDisconnect = (session) => {};
    this.onEHLO = async (domain,session) => true;
    this.onMAILFROM = async (address,session) => true;
    this.onRCPTTO = async (address,session) => true;
    this.onSecure = async (session) => true;
    this.onDATA = async (message,session) => true;
  }

  // Method to set options, allowing for overrides by the implementing project
  setOptions(options = {}) {
    Object.assign(this, options)
   }
}

// Export a singleton instance of the context
export default new ServerContext();
