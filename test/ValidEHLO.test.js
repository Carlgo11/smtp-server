import test from 'node:test';
import isValidEHLO from '../src/utils/ValidEHLO.js';
import assert from 'node:assert';

test('Test valid EHLO values', () => {
  assert.ok(isValidEHLO('example.com'));
  assert.ok(isValidEHLO('[1.1.1.1]'));
});

test('Test invalid EHLO values', () => {
  assert.strictEqual(isValidEHLO('example-.com'), false);
  assert.strictEqual(isValidEHLO('€xample.com'), false);
  assert.strictEqual(isValidEHLO(`example.com}`), false);
  assert.strictEqual(isValidEHLO('1.1.1.1'), false);
});
