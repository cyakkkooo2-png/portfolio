const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { AnalyticsStore } = require('../analytics/store');
const { isComplete, normalizeEvent } = require('../analytics/metrics');

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccy-analytics-'));
  const store = new AnalyticsStore(path.join(dir, 'test.sqlite'));
  return { store, cleanup: () => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); } };
}

test('95% or final two seconds counts as complete', () => {
  assert.equal(isComplete(95, 100), true);
  assert.equal(isComplete(98.1, 100), true);
  assert.equal(isComplete(90, 100), false);
});

test('event cleaning keeps only approved metadata', () => {
  const event = normalizeEvent({ event_id: 'a', event_type: 'work_open', metadata: { watch_id: 'w1', secret: 'no' } });
  assert.deepEqual(event.metadata, { watch_id: 'w1' });
});

test('sessions split after 30 minutes and duplicate events are ignored', () => {
  const { store, cleanup } = setup();
  try {
    const first = store.startSession({ visitorId: 'v1', now: '2026-10-13T00:00:00.000Z' });
    const same = store.startSession({ visitorId: 'v1', sessionId: first.sessionId, now: '2026-10-13T00:20:00.000Z' });
    const next = store.startSession({ visitorId: 'v1', sessionId: first.sessionId, now: '2026-10-13T01:00:01.000Z' });
    assert.equal(same.sessionId, first.sessionId);
    assert.notEqual(next.sessionId, first.sessionId);

    const payload = { visitorId: 'v1', sessionId: next.sessionId, events: [{ event_id: 'e1', event_type: 'work_open', work_id: 'work-1' }] };
    assert.equal(store.ingestEvents(payload).accepted, 1);
    assert.equal(store.ingestEvents(payload).accepted, 0);
  } finally { cleanup(); }
});

test('overview excludes internal visits unless requested', () => {
  const { store, cleanup } = setup();
  try {
    const publicSession = store.startSession({ visitorId: 'public', now: '2026-10-13T10:00:00.000Z' });
    const adminSession = store.startSession({ visitorId: 'admin', now: '2026-10-13T10:00:00.000Z', isInternal: true });
    store.ingestEvents({ visitorId: 'public', sessionId: publicSession.sessionId, events: [{ event_id: 'p1', event_type: 'work_open', work_id: 'w1', occurred_at: '2026-10-13T10:01:00.000Z' }] });
    store.ingestEvents({ visitorId: 'admin', sessionId: adminSession.sessionId, isInternal: true, events: [{ event_id: 'a1', event_type: 'work_open', work_id: 'w1', occurred_at: '2026-10-13T10:01:00.000Z' }] });
    assert.equal(store.overview({ start: '2026-10-13', end: '2026-10-13' }).metrics.work_opens, 1);
    assert.equal(store.overview({ start: '2026-10-13', end: '2026-10-13', include_internal: 'true' }).metrics.work_opens, 2);
  } finally { cleanup(); }
});

test('a play is counted only after one second of real watch time', () => {
  const { store, cleanup } = setup();
  try {
    const session = store.startSession({ visitorId: 'viewer', now: '2026-10-13T10:00:00.000Z' });
    store.ingestEvents({ visitorId: 'viewer', sessionId: session.sessionId, events: [
      { event_id: 'start', event_type: 'video_start', work_id: 'video-1', occurred_at: '2026-10-13T10:01:00.000Z', metadata: { watch_id: 'watch-1' } },
    ] });
    assert.equal(store.overview({ start: '2026-10-13', end: '2026-10-13' }).metrics.plays, 0);
    store.ingestEvents({ visitorId: 'viewer', sessionId: session.sessionId, events: [
      { event_id: 'beat', event_type: 'video_heartbeat', work_id: 'video-1', occurred_at: '2026-10-13T10:01:02.000Z', watched_seconds: 1.2, position_seconds: 1.2, max_position_seconds: 1.2, duration_seconds: 60, metadata: { watch_id: 'watch-1' } },
    ] });
    assert.equal(store.overview({ start: '2026-10-13', end: '2026-10-13' }).metrics.plays, 1);
  } finally { cleanup(); }
});
