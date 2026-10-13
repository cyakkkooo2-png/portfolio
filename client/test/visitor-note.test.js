import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVisitorNote } from '../src/utils/visitor-note.js';

test('trims a visitor note and limits it to 30 characters', () => {
  assert.equal(normalizeVisitorNote('  广州客户  '), '广州客户');
  assert.equal(normalizeVisitorNote('一'.repeat(40)), '一'.repeat(30));
  assert.equal(normalizeVisitorNote('   '), '');
});
