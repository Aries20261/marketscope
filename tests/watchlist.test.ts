import test from 'node:test';
import assert from 'node:assert/strict';
import { statusTarget, parseTarget } from '../src/lib/watchlist.ts';

test('statusTarget', () => {
  assert.equal(statusTarget(50000, null), 'tanpa');
  assert.equal(statusTarget(50000, 45000), 'menunggu');
  assert.equal(statusTarget(45000, 45000), 'tercapai');
  assert.equal(statusTarget(40000, 45000), 'tercapai');
  assert.equal(statusTarget(null, 45000), 'menunggu');
});

test('parseTarget', () => {
  assert.equal(parseTarget('45.000'), 45000);
  assert.equal(parseTarget('Rp 45000'), 45000);
  assert.equal(parseTarget(''), null);
  assert.equal(parseTarget('abc'), undefined);
  assert.equal(parseTarget('0'), undefined);
});
