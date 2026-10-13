const COMPLETION_RATIO = 0.95;

function clampNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

function isComplete(maxPosition, duration) {
  const position = clampNumber(maxPosition);
  const total = clampNumber(duration);
  if (position === null || total === null || total <= 0) return false;
  return position >= total * COMPLETION_RATIO || total - position <= 2;
}

function normalizeEvent(raw = {}) {
  const allowedMetadata = ['from', 'to', 'visible_ratio', 'watch_id', 'path', 'reason'];
  const metadata = {};
  const sourceMetadata = raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : {};
  allowedMetadata.forEach((key) => {
    const value = sourceMetadata[key];
    if (typeof value === 'string') metadata[key] = value.slice(0, 200);
    else if (typeof value === 'number' && Number.isFinite(value)) metadata[key] = value;
    else if (typeof value === 'boolean') metadata[key] = value;
  });

  const parsedDate = raw.occurred_at ? new Date(raw.occurred_at) : new Date();
  const occurredAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  return {
    eventId: String(raw.event_id || '').slice(0, 80),
    eventType: String(raw.event_type || '').slice(0, 40),
    workId: raw.work_id ? String(raw.work_id).slice(0, 80) : null,
    occurredAt,
    positionSeconds: clampNumber(raw.position_seconds, 0, 86400),
    durationSeconds: clampNumber(raw.duration_seconds, 0, 86400),
    maxPositionSeconds: clampNumber(raw.max_position_seconds, 0, 86400),
    watchedSeconds: clampNumber(raw.watched_seconds, 0, 86400),
    activeSeconds: clampNumber(raw.active_seconds, 0, 86400),
    targetPlatform: raw.target_platform ? String(raw.target_platform).slice(0, 40) : null,
    targetUrlHost: raw.target_url_host ? String(raw.target_url_host).slice(0, 200) : null,
    metadata,
  };
}

module.exports = { COMPLETION_RATIO, clampNumber, isComplete, normalizeEvent };
