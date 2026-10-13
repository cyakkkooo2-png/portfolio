const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const { DATA_DIR, ensureDir } = require('../paths');
const { cleanVisitorTimeline, isComplete, normalizeEvent } = require('./metrics');

const EVENT_TYPES = new Set([
  'page_view', 'work_impression', 'work_open', 'video_start', 'video_pause',
  'video_resume', 'video_seek', 'video_heartbeat', 'video_complete', 'work_close',
  'external_jump', 'session_end',
]);

function dateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

class AnalyticsStore {
  constructor(filename = process.env.ANALYTICS_DB_PATH || path.join(DATA_DIR, 'analytics.sqlite')) {
    ensureDir(path.dirname(filename));
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analytics_visitors (
        visitor_id TEXT PRIMARY KEY,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        first_city TEXT,
        first_district TEXT,
        session_count INTEGER NOT NULL DEFAULT 0,
        is_bot INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        session_id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        ended_at TEXT,
        city TEXT,
        district TEXT,
        adcode TEXT,
        referrer_host TEXT,
        landing_path TEXT,
        device_type TEXT,
        browser_family TEXT,
        os_family TEXT,
        active_seconds REAL NOT NULL DEFAULT 0,
        is_internal INTEGER NOT NULL DEFAULT 0,
        is_bot INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(visitor_id) REFERENCES analytics_visitors(visitor_id)
      );
      CREATE TABLE IF NOT EXISTS analytics_events (
        event_id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        work_id TEXT,
        event_type TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        received_at TEXT NOT NULL,
        position_seconds REAL,
        duration_seconds REAL,
        max_position_seconds REAL,
        watched_seconds REAL,
        active_seconds REAL,
        target_platform TEXT,
        target_url_host TEXT,
        metadata_json TEXT,
        is_internal INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS analytics_video_sessions (
        watch_id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        work_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds REAL,
        watched_seconds REAL NOT NULL DEFAULT 0,
        max_position_seconds REAL NOT NULL DEFAULT 0,
        exit_position_seconds REAL NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0,
        sought INTEGER NOT NULL DEFAULT 0,
        external_jump INTEGER NOT NULL DEFAULT 0,
        is_internal INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_events_time ON analytics_events(occurred_at);
      CREATE INDEX IF NOT EXISTS idx_events_work ON analytics_events(work_id, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_events_visitor ON analytics_events(visitor_id, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_time ON analytics_sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_video_work ON analytics_video_sessions(work_id, started_at);
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_impression_session_work
        ON analytics_events(session_id, work_id, event_type) WHERE event_type='work_impression';
    `);
  }

  startSession({ visitorId, sessionId, now = new Date().toISOString(), geo = {}, request = {}, isInternal = false, isBot = false }) {
    const visitor = visitorId || uuidv4();
    const existing = this.db.prepare('SELECT * FROM analytics_visitors WHERE visitor_id = ?').get(visitor);
    this.db.prepare(`
      INSERT INTO analytics_visitors(visitor_id, first_seen_at, last_seen_at, first_city, first_district, session_count, is_bot)
      VALUES (?, ?, ?, ?, ?, 0, ?)
      ON CONFLICT(visitor_id) DO UPDATE SET last_seen_at=excluded.last_seen_at, is_bot=MAX(is_bot, excluded.is_bot)
    `).run(visitor, now, now, geo.city || null, geo.district || null, isBot ? 1 : 0);

    let activeSession = sessionId ? this.db.prepare('SELECT * FROM analytics_sessions WHERE session_id = ? AND visitor_id = ?').get(sessionId, visitor) : null;
    const inactive = activeSession && (new Date(now) - new Date(activeSession.last_seen_at) > 30 * 60 * 1000);
    if (!activeSession || inactive) {
      const nextSessionId = uuidv4();
      this.db.prepare(`
        INSERT INTO analytics_sessions(session_id, visitor_id, started_at, last_seen_at, city, district, adcode, referrer_host, landing_path, device_type, browser_family, os_family, is_internal, is_bot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nextSessionId, visitor, now, now, geo.city || null, geo.district || null, geo.adcode || null,
        request.referrerHost || null, request.landingPath || '/', request.deviceType || 'unknown',
        request.browserFamily || 'unknown', request.osFamily || 'unknown', isInternal ? 1 : 0, isBot ? 1 : 0);
      this.db.prepare('UPDATE analytics_visitors SET session_count = session_count + 1 WHERE visitor_id = ?').run(visitor);
      activeSession = this.db.prepare('SELECT * FROM analytics_sessions WHERE session_id = ?').get(nextSessionId);
    } else {
      this.db.prepare('UPDATE analytics_sessions SET last_seen_at = ?, is_internal = MAX(is_internal, ?) WHERE session_id = ?')
        .run(now, isInternal ? 1 : 0, activeSession.session_id);
    }

    return { visitorId: visitor, sessionId: activeSession.session_id, isNewVisitor: !existing };
  }

  ingestEvents({ visitorId, sessionId, events, isInternal = false }) {
    const session = this.db.prepare('SELECT * FROM analytics_sessions WHERE session_id = ? AND visitor_id = ?').get(sessionId, visitorId);
    if (!session) throw new Error('invalid_session');
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO analytics_events(event_id, visitor_id, session_id, work_id, event_type, occurred_at, received_at,
        position_seconds, duration_seconds, max_position_seconds, watched_seconds, active_seconds, target_platform, target_url_host, metadata_json, is_internal)
      VALUES (@eventId, @visitorId, @sessionId, @workId, @eventType, @occurredAt, @receivedAt,
        @positionSeconds, @durationSeconds, @maxPositionSeconds, @watchedSeconds, @activeSeconds, @targetPlatform, @targetUrlHost, @metadataJson, @isInternal)
    `);
    const updateVideo = this.db.prepare(`
      INSERT INTO analytics_video_sessions(watch_id, visitor_id, session_id, work_id, started_at, ended_at, duration_seconds,
        watched_seconds, max_position_seconds, exit_position_seconds, completed, sought, external_jump, is_internal)
      VALUES (@watchId, @visitorId, @sessionId, @workId, @startedAt, @endedAt, @durationSeconds,
        @watchedSeconds, @maxPositionSeconds, @exitPositionSeconds, @completed, @sought, @externalJump, @isInternal)
      ON CONFLICT(watch_id) DO UPDATE SET
        ended_at=COALESCE(excluded.ended_at, ended_at), duration_seconds=COALESCE(excluded.duration_seconds, duration_seconds),
        watched_seconds=MAX(watched_seconds, excluded.watched_seconds), max_position_seconds=MAX(max_position_seconds, excluded.max_position_seconds),
        exit_position_seconds=excluded.exit_position_seconds, completed=MAX(completed, excluded.completed),
        sought=MAX(sought, excluded.sought), external_jump=MAX(external_jump, excluded.external_jump), is_internal=MAX(is_internal, excluded.is_internal)
    `);

    let accepted = 0;
    this.db.transaction(() => {
      for (const raw of Array.isArray(events) ? events.slice(0, 100) : []) {
        const event = normalizeEvent(raw);
        if (!event.eventId || !EVENT_TYPES.has(event.eventType)) continue;
        const result = insert.run({
          ...event, visitorId, sessionId, receivedAt: new Date().toISOString(),
          metadataJson: JSON.stringify(event.metadata), isInternal: isInternal || session.is_internal ? 1 : 0,
        });
        if (!result.changes) continue;
        accepted += 1;
        const watchId = event.metadata.watch_id;
        if (watchId && event.workId && event.eventType.startsWith('video_') || (watchId && event.workId && ['work_close', 'external_jump'].includes(event.eventType))) {
          updateVideo.run({
            watchId: String(watchId).slice(0, 80), visitorId, sessionId, workId: event.workId,
            startedAt: event.occurredAt,
            endedAt: ['work_close', 'video_complete'].includes(event.eventType) ? event.occurredAt : null,
            durationSeconds: event.durationSeconds,
            watchedSeconds: event.watchedSeconds || 0,
            maxPositionSeconds: event.maxPositionSeconds || event.positionSeconds || 0,
            exitPositionSeconds: event.positionSeconds || 0,
            completed: event.eventType === 'video_complete' || isComplete(event.maxPositionSeconds || event.positionSeconds, event.durationSeconds) ? 1 : 0,
            sought: event.eventType === 'video_seek' ? 1 : 0,
            externalJump: event.eventType === 'external_jump' ? 1 : 0,
            isInternal: isInternal || session.is_internal ? 1 : 0,
          });
        }
      }
      const latest = new Date().toISOString();
      const activeSeconds = (Array.isArray(events) ? events : []).reduce((max, event) => Math.max(max, Number(event.active_seconds) || 0), 0);
      this.db.prepare('UPDATE analytics_sessions SET last_seen_at=?, active_seconds=MAX(active_seconds, ?), is_internal=MAX(is_internal, ?) WHERE session_id=?')
        .run(latest, activeSeconds, isInternal ? 1 : 0, sessionId);
      this.db.prepare('UPDATE analytics_visitors SET last_seen_at=? WHERE visitor_id=?').run(latest, visitorId);
    })();
    return { accepted };
  }

  filters(query = {}) {
    const end = query.end ? new Date(`${query.end}T23:59:59.999+08:00`).toISOString() : new Date().toISOString();
    const start = query.start ? new Date(`${query.start}T00:00:00.000+08:00`).toISOString() : new Date(Date.now() - 29 * 86400000).toISOString();
    return { start, end, internal: query.include_internal === 'true' ? 1 : 0 };
  }

  overview(query = {}) {
    const f = this.filters(query);
    const internalClause = f.internal ? '' : 'AND is_internal = 0';
    const events = this.db.prepare(`SELECT
      COUNT(DISTINCT visitor_id) uv,
      COUNT(DISTINCT session_id) sessions,
      SUM(event_type='work_open') work_opens,
      SUM(event_type='video_start') video_starts,
      SUM(event_type='external_jump') external_jumps
      FROM analytics_events WHERE occurred_at BETWEEN ? AND ? ${internalClause}`).get(f.start, f.end);
    const video = this.db.prepare(`SELECT COUNT(CASE WHEN watched_seconds>=1 THEN 1 END) plays, COALESCE(SUM(CASE WHEN watched_seconds>=1 THEN watched_seconds ELSE 0 END),0) watched_seconds,
      COALESCE(AVG(watched_seconds),0) avg_watch_seconds,
      COALESCE(AVG(CASE WHEN duration_seconds>0 THEN max_position_seconds/duration_seconds*100 END),0) avg_progress,
      COALESCE(AVG(completed)*100,0) completion_rate
      FROM analytics_video_sessions WHERE started_at BETWEEN ? AND ? AND watched_seconds>=1 ${internalClause}`).get(f.start, f.end);
    const newVisitors = this.db.prepare(`SELECT COUNT(*) count FROM analytics_visitors WHERE first_seen_at BETWEEN ? AND ?`).get(f.start, f.end).count;
    return { range: f, metrics: { ...events, ...video, new_visitors: newVisitors } };
  }

  trends(query = {}) {
    const f = this.filters(query);
    const internalClause = f.internal ? '' : 'AND is_internal = 0';
    return this.db.prepare(`SELECT strftime('%Y-%m-%d', occurred_at, '+8 hours') day,
      COUNT(DISTINCT visitor_id) uv, COUNT(DISTINCT session_id) sessions,
      SUM(event_type='work_open') work_opens, SUM(event_type='video_start') video_starts,
      SUM(COALESCE(watched_seconds,0)) watched_seconds
      FROM analytics_events WHERE occurred_at BETWEEN ? AND ? ${internalClause}
      GROUP BY day ORDER BY day`).all(f.start, f.end);
  }

  works(query = {}) {
    const f = this.filters(query);
    const internalClause = f.internal ? '' : 'AND e.is_internal = 0';
    return this.db.prepare(`SELECT e.work_id,
      SUM(e.event_type='work_impression') impressions,
      SUM(e.event_type='work_open') opens,
      COUNT(DISTINCT CASE WHEN e.event_type='work_open' THEN e.visitor_id END) open_uv,
      SUM(e.event_type='external_jump') external_jumps,
      COALESCE((SELECT COUNT(*) FROM analytics_video_sessions v WHERE v.work_id=e.work_id AND v.started_at BETWEEN ? AND ? AND v.watched_seconds>=1 ${f.internal ? '' : 'AND v.is_internal=0'}),0) plays,
      COALESCE((SELECT AVG(v.watched_seconds) FROM analytics_video_sessions v WHERE v.work_id=e.work_id AND v.started_at BETWEEN ? AND ? AND v.watched_seconds>=1 ${f.internal ? '' : 'AND v.is_internal=0'}),0) avg_watch_seconds,
      COALESCE((SELECT AVG(v.completed)*100 FROM analytics_video_sessions v WHERE v.work_id=e.work_id AND v.started_at BETWEEN ? AND ? AND v.watched_seconds>=1 ${f.internal ? '' : 'AND v.is_internal=0'}),0) completion_rate,
      COALESCE((SELECT AVG(v.watched_seconds<3)*100 FROM analytics_video_sessions v WHERE v.work_id=e.work_id AND v.started_at BETWEEN ? AND ? AND v.watched_seconds>=1 ${f.internal ? '' : 'AND v.is_internal=0'}),0) short_bounce_rate,
      COALESCE((SELECT AVG(CASE WHEN v.duration_seconds>0 THEN v.max_position_seconds/v.duration_seconds*100 END) FROM analytics_video_sessions v WHERE v.work_id=e.work_id AND v.started_at BETWEEN ? AND ? AND v.watched_seconds>=1 ${f.internal ? '' : 'AND v.is_internal=0'}),0) avg_progress
      FROM analytics_events e WHERE e.work_id IS NOT NULL AND e.occurred_at BETWEEN ? AND ? ${internalClause}
      GROUP BY e.work_id ORDER BY opens DESC`).all(f.start, f.end, f.start, f.end, f.start, f.end, f.start, f.end, f.start, f.end, f.start, f.end);
  }

  workDetail(workId, query = {}) {
    const f = this.filters(query);
    const internalClause = f.internal ? '' : 'AND is_internal = 0';
    const watches = this.db.prepare(`SELECT * FROM analytics_video_sessions WHERE work_id=? AND started_at BETWEEN ? AND ? ${internalClause}`).all(workId, f.start, f.end);
    const maxDuration = watches.reduce((max, item) => Math.max(max, item.duration_seconds || 0), 0);
    const bucketSize = maxDuration <= 600 ? 2 : Math.max(5, Math.ceil(maxDuration / 100));
    const buckets = [];
    for (let second = 0; second <= maxDuration; second += bucketSize) {
      const viewers = watches.filter((item) => item.max_position_seconds >= second).length;
      buckets.push({ second, viewers, retention: watches.length ? viewers / watches.length * 100 : 0 });
    }
    return { work_id: workId, watches, retention: buckets };
  }

  visitors(query = {}) {
    const f = this.filters(query);
    const internalClause = f.internal ? '' : 'AND s.is_internal = 0';
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
    const offset = Math.max(0, Number(query.offset) || 0);
    return this.db.prepare(`SELECT s.visitor_id, MIN(s.started_at) first_seen_at, MAX(s.started_at) last_entered_at, MAX(s.last_seen_at) last_seen_at,
      MAX(s.city) city, MAX(s.district) district, MAX(s.device_type) device_type,
      COUNT(*) session_count, SUM(s.active_seconds) active_seconds
      FROM analytics_sessions s WHERE s.started_at BETWEEN ? AND ? ${internalClause}
      GROUP BY s.visitor_id ORDER BY last_seen_at DESC LIMIT ? OFFSET ?`).all(f.start, f.end, limit, offset);
  }

  visitorDetail(visitorId, query = {}) {
    const f = this.filters(query);
    const internalClause = f.internal ? '' : 'AND is_internal=0';
    const sessions = this.db.prepare(`SELECT * FROM analytics_sessions WHERE visitor_id=? AND started_at BETWEEN ? AND ? ${internalClause} ORDER BY started_at DESC`).all(visitorId, f.start, f.end);
    const events = cleanVisitorTimeline(this.db.prepare(`SELECT * FROM analytics_events WHERE visitor_id=? AND occurred_at BETWEEN ? AND ? ${internalClause} ORDER BY occurred_at`).all(visitorId, f.start, f.end))
      .map((event) => ({ ...event, metadata: JSON.parse(event.metadata_json || '{}') }));
    return { visitor_id: visitorId, sessions, events };
  }

  deleteVisitor(visitorId) {
    const visitor = this.db.prepare('SELECT visitor_id FROM analytics_visitors WHERE visitor_id=?').get(visitorId);
    if (!visitor) return null;

    return this.db.transaction(() => {
      const events = this.db.prepare('DELETE FROM analytics_events WHERE visitor_id=?').run(visitorId).changes;
      const videos = this.db.prepare('DELETE FROM analytics_video_sessions WHERE visitor_id=?').run(visitorId).changes;
      const sessions = this.db.prepare('DELETE FROM analytics_sessions WHERE visitor_id=?').run(visitorId).changes;
      this.db.prepare('DELETE FROM analytics_visitors WHERE visitor_id=?').run(visitorId);
      return { visitor_id: visitorId, deleted: { events, videos, sessions } };
    })();
  }

  geo(query = {}) {
    const f = this.filters(query);
    const internalClause = f.internal ? '' : 'AND is_internal = 0';
    const locations = this.db.prepare(`SELECT COALESCE(city,'未知') city, COALESCE(district,'') district,
      COUNT(DISTINCT visitor_id) visitors, COUNT(*) sessions, AVG(active_seconds) avg_active_seconds
      FROM analytics_sessions WHERE started_at BETWEEN ? AND ? ${internalClause}
      GROUP BY city,district ORDER BY visitors DESC`).all(f.start, f.end);
    const sources = this.db.prepare(`SELECT COALESCE(NULLIF(referrer_host,''),'直接访问') source, COUNT(*) sessions
      FROM analytics_sessions WHERE started_at BETWEEN ? AND ? ${internalClause}
      GROUP BY source ORDER BY sessions DESC`).all(f.start, f.end);
    const devices = this.db.prepare(`SELECT COALESCE(device_type,'unknown') device, COUNT(*) sessions
      FROM analytics_sessions WHERE started_at BETWEEN ? AND ? ${internalClause}
      GROUP BY device ORDER BY sessions DESC`).all(f.start, f.end);
    return { locations, sources, devices };
  }

  cleanup(days = 180) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const events = this.db.prepare('DELETE FROM analytics_events WHERE occurred_at < ?').run(cutoff).changes;
    const videos = this.db.prepare('DELETE FROM analytics_video_sessions WHERE started_at < ?').run(cutoff).changes;
    const sessions = this.db.prepare('DELETE FROM analytics_sessions WHERE started_at < ?').run(cutoff).changes;
    return { cutoff, events, videos, sessions };
  }

  close() { this.db.close(); }
}

module.exports = { AnalyticsStore, EVENT_TYPES, dateOnly };
