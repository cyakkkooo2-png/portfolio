const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { AnalyticsStore } = require('../analytics/store');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { parseCookies, userAgentInfo, referrerHost, resolveGeo } = require('../analytics/request-context');

const router = express.Router();
const store = new AnalyticsStore();
const rate = new Map();

function rateLimit(req, res, next) {
  if (Number(req.headers['content-length'] || 0) > 262144) return res.status(413).json({ error: '上报数据过大' });
  const key = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
  const now = Date.now();
  const current = rate.get(key) || { start: now, count: 0 };
  if (now - current.start > 60000) Object.assign(current, { start: now, count: 0 });
  current.count += 1;
  rate.set(key, current);
  if (current.count > 120) return res.status(429).json({ error: '上报过于频繁' });
  next();
}

function setCookie(res, name, value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

router.post('/session', rateLimit, optionalAuthMiddleware, async (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const ua = userAgentInfo(req.headers['user-agent'] || '');
  const geo = await resolveGeo(req);
  const result = store.startSession({
    visitorId: cookies.ccy_vid || uuidv4(), sessionId: cookies.ccy_sid,
    geo, isInternal: Boolean(req.user), isBot: ua.isBot,
    request: {
      referrerHost: referrerHost(req.body?.referrer || req.headers.referer || ''),
      landingPath: String(req.body?.landing_path || '/').slice(0, 300),
      ...ua,
    },
  });
  setCookie(res, 'ccy_vid', result.visitorId, 180 * 86400);
  setCookie(res, 'ccy_sid', result.sessionId, 30 * 60);
  res.json({ session_id: result.sessionId, is_new_visitor: result.isNewVisitor, geo: { city: geo.city || '', district: geo.district || '' } });
});

router.post('/events/batch', rateLimit, optionalAuthMiddleware, (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionId = String(req.body?.session_id || cookies.ccy_sid || '');
  const session = store.db.prepare('SELECT visitor_id FROM analytics_sessions WHERE session_id=?').get(sessionId);
  if (!session) return res.status(400).json({ error: '分析会话已失效，请刷新后重试', code: 'ANALYTICS_SESSION_EXPIRED' });
  try {
    const result = store.ingestEvents({
      visitorId: session.visitor_id, sessionId, events: req.body?.events,
      isInternal: Boolean(req.user),
    });
    setCookie(res, 'ccy_sid', sessionId, 30 * 60);
    res.json(result);
  } catch (error) {
    if (error.message === 'invalid_session') return res.status(400).json({ error: '分析会话无效' });
    console.error('Analytics ingest failed:', error.message);
    res.status(503).json({ error: '分析服务暂时不可用' });
  }
});

router.use(authMiddleware);
router.get('/overview', (req, res) => res.json(store.overview(req.query)));
router.get('/trends', (req, res) => res.json({ trends: store.trends(req.query) }));
router.get('/works', (req, res) => res.json({ works: store.works(req.query) }));
router.get('/works/:id', (req, res) => res.json(store.workDetail(req.params.id, req.query)));
router.get('/visitors', (req, res) => res.json({ visitors: store.visitors(req.query) }));
router.get('/visitors/:id', (req, res) => res.json(store.visitorDetail(req.params.id, req.query)));
router.delete('/visitors/:id', (req, res) => {
  const result = store.deleteVisitor(req.params.id);
  if (!result) return res.status(404).json({ error: '访客不存在或已被删除' });
  res.json(result);
});
router.get('/geo', (req, res) => res.json(store.geo(req.query)));
router.get('/export', (req, res) => {
  const rows = store.works(req.query);
  const headers = ['work_id', 'impressions', 'opens', 'open_uv', 'plays', 'avg_watch_seconds', 'completion_rate', 'external_jumps'];
  const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n');
  res.type('text/csv; charset=utf-8').attachment('ccyspace-analytics.csv').send(`\uFEFF${csv}`);
});

router.analyticsStore = store;
module.exports = router;
