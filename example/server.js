import {startSMTPServer} from '../src/index.js';
import fs from 'fs';

const server = startSMTPServer({
  port: 2525, // Custom port
  tlsOptions: {
    key: fs.readFileSync(process.env.TLS_KEY_PATH),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH),
    handshakeTimeout: 5000,
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',
    ALPNProtocols: ['h2'],
  },
  onCommand: (message) => {
    console.log(`Custom command handler received message: ${message}`);
    // Custom command handling logic here...
  },
  onDisconnect: (session) => {
    console.log(`${session.clientIP} disconnected`);
  },
  onSecure: (session) => {
    console.log(`${session.clientIP} secured`);
  },
  onConnect: (session) => {
    console.log(session);
    console.log(`New connection established from ${session.clientIP}`);
    // Additional logic for new connections...
  },
});

// Optionally, add more custom handlers or configurations
