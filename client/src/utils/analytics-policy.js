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
