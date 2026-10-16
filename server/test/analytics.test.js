const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { AnalyticsStore } = require('../analytics/store');
const { cleanVisitorTimeline, isComplete, normalizeEvent } = require('../analytics/metrics');

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

test('visitor timeline removes same-second duplicates and background impressions', () => {
  const events = [
    { event_id: 'open-a', event_type: 'work_open', work_id: 'video-a', occurred_at: '2026-10-13T10:00:00.000Z' },
    { event_id: 'background-b', event_type: 'work_impression', work_id: 'article-b', occurred_at: '2026-10-13T10:00:01.000Z' },
    { event_id: 'close-a-modal', event_type: 'work_close', work_id: 'video-a', occurred_at: '2026-10-13T10:00:02.100Z' },
    { event_id: 'close-a-player', event_type: 'work_close', work_id: 'video-a', occurred_at: '2026-10-13T10:00:02.800Z', position_seconds: 4, watched_seconds: 3.5 },
    { event_id: 'end-1', event_type: 'session_end', work_id: null, occurred_at: '2026-10-13T10:00:03.100Z' },
    { event_id: 'end-2', event_type: 'session_end', work_id: null, occurred_at: '2026-10-13T10:00:03.900Z' },
    { event_id: 'open-b', event_type: 'work_open', work_id: 'article-b', occurred_at: '2026-10-13T10:00:04.000Z' },
  ];

  assert.deepEqual(cleanVisitorTimeline(events).map((event) => event.event_id), [
    'open-a', 'close-a-player', 'end-2', 'open-b',
  ]);
});

test('visitor timeline collapses browser noise around an external journey', () => {
  const events = [
    { event_id: 'jump', event_type: 'external_jump', work_id: 'video-a', target_platform: 'feishu', occurred_at: '2026-10-13T10:00:00.000Z' },
    { event_id: 'hidden', event_type: 'session_end', occurred_at: '2026-10-13T10:00:01.000Z' },
    { event_id: 'pause', event_type: 'video_pause', work_id: 'video-a', position_seconds: 4, occurred_at: '2026-10-13T10:00:08.000Z' },
    { event_id: 'resume', event_type: 'video_resume', work_id: 'video-a', position_seconds: 4, occurred_at: '2026-10-13T10:00:08.500Z' },
    { event_id: 'hidden-again', event_type: 'session_end', occurred_at: '2026-10-13T10:00:09.000Z' },
    { event_id: 'open-b', event_type: 'work_open', work_id: 'article-b', occurred_at: '2026-10-13T10:00:12.000Z' },
  ];

  assert.deepEqual(cleanVisitorTimeline(events).map((event) => event.event_id), ['jump', 'open-b']);
});

test('visitor timeline keeps one explicit return after an external journey', () => {
  const events = [
    { event_id: 'jump', event_type: 'external_jump', work_id: 'video-a', occurred_at: '2026-10-13T10:00:00.000Z' },
    { event_id: 'hidden', event_type: 'session_end', occurred_at: '2026-10-13T10:00:01.000Z' },
    { event_id: 'return', event_type: 'external_return', work_id: 'video-a', occurred_at: '2026-10-13T10:02:00.000Z', metadata_json: '{"away_seconds":120}' },
  ];

  assert.deepEqual(cleanVisitorTimeline(events).map((event) => event.event_id), ['jump', 'return']);
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
    store.ingestEvents({ visitorId: 'public', sessionId: publicSession.sessionId, events: [{ event_id: 'p1', event_type: 'work_open', work_id: 'w1', occurred_at: '2026-10-13T10:01:00.000Z', active_seconds: 10 }] });
    store.ingestEvents({ visitorId: 'admin', sessionId: adminSession.sessionId, isInternal: true, events: [{ event_id: 'a1', event_type: 'work_open', work_id: 'w1', occurred_at: '2026-10-13T10:01:00.000Z', active_seconds: 10 }] });
    assert.equal(store.overview({ start: '2026-10-13', end: '2026-10-13' }).metrics.work_opens, 1);
    assert.equal(store.overview({ start: '2026-10-13', end: '2026-10-13', include_internal: 'true' }).metrics.work_opens, 2);
  } finally { cleanup(); }
});

test('a play is counted only after one second of real watch time', () => {
  const { store, cleanup } = setup();
  try {
    const session = store.startSession({ visitorId: 'viewer', now: '2026-10-13T10:00:00.000Z' });
    store.ingestEvents({ visitorId: 'viewer', sessionId: session.sessionId, events: [
      { event_id: 'start', event_type: 'video_start', work_id: 'video-1', occurred_at: '2026-10-13T10:01:00.000Z', active_seconds: 10, metadata: { watch_id: 'watch-1' } },
    ] });
    assert.equal(store.overview({ start: '2026-10-13', end: '2026-10-13' }).metrics.plays, 0);
    store.ingestEvents({ visitorId: 'viewer', sessionId: session.sessionId, events: [
      { event_id: 'beat', event_type: 'video_heartbeat', work_id: 'video-1', occurred_at: '2026-10-13T10:01:02.000Z', watched_seconds: 1.2, position_seconds: 1.2, max_position_seconds: 1.2, duration_seconds: 60, metadata: { watch_id: 'watch-1' } },
    ] });
    assert.equal(store.overview({ start: '2026-10-13', end: '2026-10-13' }).metrics.plays, 1);
  } finally { cleanup(); }
});

test('admin analytics accepts ten-second impressions but ignores short or empty sessions', () => {
  const { store, cleanup } = setup();
  try {
    const seed = ({ visitorId, city, activeSeconds, events }) => {
      const session = store.startSession({
        visitorId,
        now: '2026-10-13T10:00:00.000Z',
        geo: { city, district: '测试区' },
      });
      store.ingestEvents({
        visitorId,
        sessionId: session.sessionId,
        events: events.map((event, index) => ({
          event_id: `${visitorId}-${index}`,
          occurred_at: `2026-10-13T10:00:${String(index + 1).padStart(2, '0')}.000Z`,
          active_seconds: activeSeconds,
          ...event,
        })),
      });
      return session;
    };

    seed({
      visitorId: 'short-with-action', city: '佛山市', activeSeconds: 9,
      events: [{ event_type: 'page_view' }, { event_type: 'work_open', work_id: 'short-work' }],
    });
    seed({
      visitorId: 'long-without-action', city: '佛山市', activeSeconds: 30,
      events: [{ event_type: 'page_view' }, { event_type: 'session_end' }],
    });
    seed({
      visitorId: 'long-with-impression', city: '深圳市', activeSeconds: 10,
      events: [{ event_type: 'page_view' }, { event_type: 'work_impression', work_id: 'impression-work' }, { event_type: 'session_end' }],
    });
    seed({
      visitorId: 'valid', city: '广州市', activeSeconds: 12,
      events: [{ event_type: 'page_view' }, { event_type: 'work_open', work_id: 'valid-work' }, { event_type: 'session_end' }],
    });

    const query = { start: '2026-10-13', end: '2026-10-13' };
    const overview = store.overview(query).metrics;
    assert.equal(overview.uv, 2);
    assert.equal(overview.sessions, 2);
    assert.equal(overview.new_visitors, 2);
    assert.equal(overview.work_opens, 1);
    assert.deepEqual(store.visitors(query).map((visitor) => visitor.visitor_id), ['valid', 'long-with-impression']);
    assert.deepEqual(store.works(query).map((work) => work.work_id), ['valid-work', 'impression-work']);
    assert.deepEqual(store.geo(query).locations.map((location) => location.city).sort(), ['广州市', '深圳市']);
    assert.equal(store.visitorDetail('short-with-action', query).sessions.length, 0);
    assert.equal(store.visitorDetail('long-without-action', query).events.length, 0);
    assert.equal(store.visitorDetail('long-with-impression', query).sessions.length, 1);
    assert.equal(store.visitorDetail('valid', query).sessions.length, 1);
  } finally { cleanup(); }
});
