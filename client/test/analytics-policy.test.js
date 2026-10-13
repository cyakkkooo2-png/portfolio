import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPageExitGate,
  shouldTrackBackgroundImpression,
  shouldTrackModalClose,
} from '../src/utils/analytics-policy.js';

test('records only one exit while pagehide and visibilitychange fire together', () => {
  const gate = createPageExitGate();
  assert.equal(gate.leave(), true);
  assert.equal(gate.leave(), false);
  gate.resume();
  assert.equal(gate.leave(), true);
});

test('does not count background card impressions while a work modal is open', () => {
  assert.equal(shouldTrackBackgroundImpression({ hasOpenWork: true, visibilityState: 'visible' }), false);
  assert.equal(shouldTrackBackgroundImpression({ hasOpenWork: false, visibilityState: 'visible' }), true);
  assert.equal(shouldTrackBackgroundImpression({ hasOpenWork: false, visibilityState: 'hidden' }), false);
});

test('video close is owned by the player so the modal does not duplicate it', () => {
  assert.equal(shouldTrackModalClose('video'), false);
  assert.equal(shouldTrackModalClose('article'), true);
  assert.equal(shouldTrackModalClose('image'), true);
});
