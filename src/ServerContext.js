import {hostname} from 'os';

class ServerContext {
  constructor() {
    // Initialize default settings
    this.port = 2525;
    this.tlsOptions = {};
    this.greeting = hostname();
    this.eventEmitter = null;
    this.onConnect = (session) => {};
    this.onEHLO = async (message,session) => true;
    this.onMAILFROM = async (address,session) => true;
    this.onRCPTTO = async (address,session) => true;
    this.onSecure = async (tlsInfo,session) => true;
    this.onDATA = async (message,session) => true;
  }

  // Method to set options, allowing for overrides by the implementing project
  setOptions(options = {}) {
    Object.assign(this, options)
   }
}

// Export a singleton instance of the context
export default new ServerContext();
