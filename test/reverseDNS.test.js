import reverseDNS from '../src/utils/reverseDNS.js';
import * as assert from 'node:assert';
import test from 'node:test';

test('test IPv4 with existing rDNS', async (t) => {
  const ip = '1.1.1.1';
  const response = await reverseDNS(ip);
  assert.strictEqual(response, 'one.one.one.one');
});

test('test IPv6 with existing rDNS', async (t) => {
  const ip = '2606:4700:4700::1111';
  const response = await reverseDNS(ip);
  assert.strictEqual(response, 'one.one.one.one');
});

test('test reserved IPv4 without rDNS', async (t) => {
  const ip = '198.51.100.1';
  const response = await reverseDNS(ip);
  assert.strictEqual(response, null);
});

test('test reserved IPv6 without rDNS', async (t) => {
  const ip = '2001:db8::4';
  const response = await reverseDNS(ip);
  assert.strictEqual(response, null);
});
