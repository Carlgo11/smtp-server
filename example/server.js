import {startSMTPServer, Response} from '../src/index.js';
import fs from 'fs';
import context from '../src/ServerContext.js';
import Logger from '../src/utils/logger.js';

const server = startSMTPServer({
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
    console.log(`New connection established from ${session.clientIP}`);
    // Additional logic for new connections...
  },
  onEHLO: async () => {
    return new Response('OK',  250 [2, 0, 0])
  }
});

server.on('EHLO', (session, domain) => {
  console.log(session.rDNS);
  console.log('session:', session.id, domain)
})

server.on('MAIL', (session, address) => {
  console.log('from:',  address);
})

// Start the server
server.listen(2525, null,() => {
  Logger.info(`SMTP Server listening on ${context.port}`);
});

// Optionally, add more custom handlers or configurations
