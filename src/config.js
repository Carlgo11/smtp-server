import fs from 'fs';

export const config = {
  key: fs.readFileSync(process.env.TLS_KEY_PATH),
  cert: fs.readFileSync(process.env.TLS_CERT_PATH),
  handshakeTimeout: 5000,
  minVersion: 'TLSv1.3',
};