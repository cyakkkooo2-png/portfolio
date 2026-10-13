import { consumeExternalJourney, createPageExitGate } from './utils/analytics-policy';

const QUEUE_KEY = 'ccy_analytics_queue_v1';
let sessionId = '';
let initPromise = null;
let queue = [];
let flushTimer = null;

function id() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function tokenHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function restoreQueue() {
  try { queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').slice(-200); } catch { queue = []; }
}

function saveQueue() {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200))); } catch { /* storage may be disabled */ }
}

export async function initAnalytics() {
  if (initPromise) return initPromise;
  restoreQueue();
  initPromise = fetch('/api/analytics/session', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
    body: JSON.stringify({ landing_path: `${location.pathname}${location.search}${location.hash}`, referrer: document.referrer, is_internal: Boolean(localStorage.getItem('token')) }),
  }).then(async (response) => {
    if (!response.ok) throw new Error('analytics_session_failed');
    const data = await response.json();
    sessionId = data.session_id;
    track('page_view', { metadata: { path: `${location.pathname}${location.search}${location.hash}` } });
    scheduleFlush(300);
    return data;
  }).catch(() => null);
  return initPromise;
}

export function track(eventType, fields = {}) {
  queue.push({ event_id: id(), event_type: eventType, occurred_at: new Date().toISOString(), ...fields });
  saveQueue();
  scheduleFlush(queue.length >= 15 ? 0 : 2500);
}

function scheduleFlush(delay) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flushAnalytics(), delay);
}

export async function flushAnalytics({ beacon = false } = {}) {
  if (!sessionId || !queue.length) return;
  const sending = queue.slice(0, 100);
  const body = JSON.stringify({ session_id: sessionId, is_internal: Boolean(localStorage.getItem('token')), events: sending });
  try {
    if (beacon && navigator.sendBeacon && !localStorage.getItem('token')) {
      const sent = navigator.sendBeacon('/api/analytics/events/batch', new Blob([body], { type: 'application/json' }));
      if (!sent) return;
    } else {
      const response = await fetch('/api/analytics/events/batch', {
        method: 'POST', credentials: 'same-origin', keepalive: beacon,
        headers: { 'Content-Type': 'application/json', ...tokenHeader() }, body,
      });
      if (!response.ok) throw new Error('analytics_flush_failed');
    }
    const sentIds = new Set(sending.map((event) => event.event_id));
    queue = queue.filter((event) => !sentIds.has(event.event_id));
    saveQueue();
    if (queue.length) scheduleFlush(300);
  } catch { saveQueue(); }
}

export function createWatchId() { return id(); }

export async function updateAnalyticsLocation(location) {
  const session = await initAnalytics();
  if (!session?.session_id) return false;
  const response = await fetch('/api/analytics/location', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
    body: JSON.stringify({
      session_id: session.session_id,
      city: location.city,
      district: location.district,
    }),
  });
  return response.ok;
}

export function startAnalyticsLifecycle() {
  const trackExternalReturn = () => {
    const journey = consumeExternalJourney(sessionStorage);
    if (!journey) return;
    track('external_return', {
      work_id: journey.workId,
      target_platform: journey.platform,
      metadata: { away_seconds: journey.awaySeconds },
    });
  };
  initAnalytics().then(trackExternalReturn);
  const exitGate = createPageExitGate();
  let activeSeconds = 0;
  let lastInteraction = Date.now();
  const activity = () => { lastInteraction = Date.now(); };
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - lastInteraction <= 60000) activeSeconds += 1;
  }, 1000);
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((name) => window.addEventListener(name, activity, { passive: true }));
  const flush = () => {
    if (!exitGate.leave()) return;
    track('session_end', { active_seconds: activeSeconds, metadata: { reason: 'pagehide' } });
    flushAnalytics({ beacon: true });
  };
  const hidden = () => {
    if (document.visibilityState === 'hidden') flush();
    else { exitGate.resume(); trackExternalReturn(); }
  };
  const resume = () => { exitGate.resume(); trackExternalReturn(); };
  window.addEventListener('pagehide', flush);
  window.addEventListener('pageshow', resume);
  window.addEventListener('focus', resume);
  document.addEventListener('visibilitychange', hidden);
  return () => {
    clearInterval(interval);
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((name) => window.removeEventListener(name, activity));
    window.removeEventListener('pagehide', flush);
    window.removeEventListener('pageshow', resume);
    window.removeEventListener('focus', resume);
    document.removeEventListener('visibilitychange', hidden);
  };
}
