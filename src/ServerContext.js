export default class ServerContext {
  constructor(options = {}) {
    this.port = options.port || 2525;
    this.tlsOptions = options.tlsOptions || {};
    this.onCommand = options.onCommand || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.eventEmitter = options.eventEmitter || null; // shared event emitter
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onSecure = options.onSecure || (() => {});
    this.onEHLO = options.onEHLO || (() => {});
    this.onMAIL = options.onMAIL || (() => {});
    this.onRCPT = options.onRCPT || (() => {});
    this.onDATA = options.onDATA || (() => {});
  }
}
