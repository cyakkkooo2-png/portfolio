import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPageExitGate,
  consumeExternalJourney,
  rememberExternalJourney,
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

test('external journey records a single return with elapsed seconds', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  rememberExternalJourney(storage, { workId: 'video-a', platform: 'feishu' }, 1000);
  assert.deepEqual(consumeExternalJourney(storage, 9500), {
    workId: 'video-a', platform: 'feishu', awaySeconds: 9,
  });
  assert.equal(consumeExternalJourney(storage, 10000), null);
});
