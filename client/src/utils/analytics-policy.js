export function createPageExitGate() {
  let ended = false;
  return {
    leave() {
      if (ended) return false;
      ended = true;
      return true;
    },
    resume() { ended = false; },
  };
}

export function shouldTrackBackgroundImpression({ hasOpenWork, visibilityState }) {
  return !hasOpenWork && visibilityState === 'visible';
}

export function shouldTrackModalClose(workType) {
  return workType !== 'video';
}

const EXTERNAL_JOURNEY_KEY = 'ccy_external_journey_v1';

export function rememberExternalJourney(storage, { workId, platform }, now = Date.now()) {
  try {
    storage?.setItem(EXTERNAL_JOURNEY_KEY, JSON.stringify({ workId, platform, startedAt: now }));
  } catch { /* session storage may be disabled */ }
}

export function consumeExternalJourney(storage, now = Date.now()) {
  try {
    const raw = storage?.getItem(EXTERNAL_JOURNEY_KEY);
    if (!raw) return null;
    storage.removeItem(EXTERNAL_JOURNEY_KEY);
    const journey = JSON.parse(raw);
    const elapsed = now - Number(journey.startedAt || 0);
    if (!journey.workId || elapsed < 0 || elapsed > 24 * 60 * 60 * 1000) return null;
    return {
      workId: String(journey.workId),
      platform: String(journey.platform || 'external'),
      awaySeconds: Math.max(1, Math.round(elapsed / 1000)),
    };
  } catch { return null; }
}
