const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccy-analytics-route-'));
process.env.ANALYTICS_DB_PATH = path.join(tempDir, 'analytics.sqlite');
const analyticsRouter = require('../routes/analytics');
const { JWT_SECRET } = require('../middleware/auth');

test('public collection writes data that only an authenticated admin can read', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/analytics', analyticsRouter);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const sessionResponse = await fetch(`${base}/api/analytics/session`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ landing_path: '/', referrer: '' }),
    });
    assert.equal(sessionResponse.status, 200);
    const session = await sessionResponse.json();
    assert.ok(session.session_id);

    const locationResponse = await fetch(`${base}/api/analytics/location`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        session_id: session.session_id,
        city: '广州市', district: '天河区',
        latitude: 23.12, longitude: 113.36,
      }),
    });
    assert.equal(locationResponse.status, 200);
    assert.deepEqual(await locationResponse.json(), { city: '广州市', district: '天河区' });

    const eventResponse = await fetch(`${base}/api/analytics/events/batch`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ session_id: session.session_id, events: [{ event_id: 'route-event-1', event_type: 'work_open', work_id: 'work-route' }] }),
    });
    assert.equal(eventResponse.status, 200);
    assert.equal((await eventResponse.json()).accepted, 1);

    assert.equal((await fetch(`${base}/api/analytics/overview`)).status, 401);
    const token = jwt.sign({ id: 'admin', username: 'admin' }, JWT_SECRET);
    const overviewResponse = await fetch(`${base}/api/analytics/overview`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(overviewResponse.status, 200);
    assert.equal((await overviewResponse.json()).metrics.work_opens, 1);

    assert.equal((await fetch(`${base}/api/analytics/visitors/${session.session_id}`, { method: 'DELETE' })).status, 401);
    const visitorsResponse = await fetch(`${base}/api/analytics/visitors`, { headers: { authorization: `Bearer ${token}` } });
    const visitor = (await visitorsResponse.json()).visitors[0];
    assert.ok(visitor.last_entered_at);
    assert.equal(visitor.last_entered_at, visitor.first_seen_at);
    const visitorId = visitor.visitor_id;
    const noteResponse = await fetch(`${base}/api/analytics/visitors/${visitorId}/note`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ note: '广州测试访客' }),
    });
    assert.equal(noteResponse.status, 200);
    assert.deepEqual(await noteResponse.json(), { visitor_id: visitorId, note: '广州测试访客' });
    const visitorDetailResponse = await fetch(`${base}/api/analytics/visitors/${visitorId}`, { headers: { authorization: `Bearer ${token}` } });
    const visitorDetail = await visitorDetailResponse.json();
    assert.equal(visitorDetail.note, '广州测试访客');
    assert.equal(visitorDetail.sessions[0].city, '广州市');
    assert.equal(visitorDetail.sessions[0].district, '天河区');
    assert.equal(Object.hasOwn(visitorDetail.sessions[0], 'latitude'), false);
    const deleteResponse = await fetch(`${base}/api/analytics/visitors/${visitorId}`, {
      method: 'DELETE', headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(deleteResponse.status, 200);
    assert.equal((await deleteResponse.json()).deleted.events, 1);
    const emptyVisitors = await fetch(`${base}/api/analytics/visitors`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal((await emptyVisitors.json()).visitors.length, 0);
    assert.equal((await fetch(`${base}/api/analytics/visitors/${visitorId}`, {
      method: 'DELETE', headers: { authorization: `Bearer ${token}` },
    })).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test.after(() => {
  analyticsRouter.analyticsStore.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
