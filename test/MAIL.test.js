import MAIL from '../src/commands/MAIL.js';
import test from 'node:test';
import Session from '../src/models/Session.js';
import assert from 'node:assert';
import context from '../src/core/ServerContext.js';

test('Test valid email address', async () => {
  let output = '';
  const address = 'test@example.com';
  const socket = {
    remoteAddress: '127.0.0.1',
    write: (log) => output += log,
  }; //Dummy socket
  const session = new Session(socket);
  session.state = 'STARTTLS';

  await MAIL([`FROM:<${address}>`], session);

  assert.equal(output, `250 Originator <${address}> ok\r\n`);
});

test('Test invalid email address', async () => {
  let output = '';
  const address = 'test@@example.com';
  const socket = {
    remoteAddress: '127.0.0.1',
    write: (log) => output += log,
  }; //Dummy socket
  const session = new Session(socket);
  session.state = 'STARTTLS';

  await MAIL([`FROM:<${address}>`], session);

  assert.equal(output, '501 Invalid email address\r\n');
});

test('Test valid UTF-8 email address', async () => {
  let output = '';
  context.extensions = ['SMTPUTF8'];
  const address = 'ßtest@example.com';
  const socket = {
    remoteAddress: '127.0.0.1',
    write: (log) => output += log,
  }; //Dummy socket
  const session = new Session(socket);
  session.state = 'STARTTLS';

  await MAIL([`FROM:<${address}>`, ['SMTPUTF8']], session);

  assert.equal(output, `250 Originator <${address}> ok\r\n`);
  context.extensions = [];
});

test('Test valid UTF-8 email address without SMTPUTF8', async () => {
  let output = '';
  context.extensions = [];
  const address = 'ßtest@example.com';
  const socket = {
    remoteAddress: '127.0.0.1',
    write: (log) => output += log,
  }; //Dummy socket
  const session = new Session(socket);
  session.state = 'STARTTLS';

  await MAIL([`FROM:<${address}>`, ['SMTPUTF8']], session);

  assert.equal(output, '504 SMTPUTF8 not supported\r\n');
  context.extensions = [];
});

test('Test valid parameters', async () => {
  let output = '';
  const address = 'test@example.com';
  const socket = {
    remoteAddress: '127.0.0.1',
    write: (log) => output += log,
  }; //Dummy socket
  const session = new Session(socket);
  session.state = 'STARTTLS';

  await MAIL([`FROM:<${address}>`, 'BODY=8BITMIME', 'SIZE=2', 'REQUIRETLS'],
    session);

  assert.equal(output, `250 Originator <${address}> ok\r\n`);
});

test('Test invalid parameters', async () => {
  let output = '';
  const address = 'test@example.com';
  const socket = {
    remoteAddress: '127.0.0.1',
    write: (log) => output += log,
  }; //Dummy socket
  const session = new Session(socket);
  session.state = 'STARTTLS';

  await MAIL([`FROM:<${address}>`, 'FAKEPARAMETER'], session);

  assert.equal(output, `501 Unrecognized parameter: FAKEPARAMETER\r\n`);
});
