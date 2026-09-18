export const DOUYIN_PLAYER_WIDTH = 324;

export const douyinStageStyle = {
  maxWidth: '520px',
};

export function resolveDouyinAspectRatio(work = {}) {
  const width = Number(work.video_width || work.width);
  const height = Number(work.video_height || work.height);
  if (width > 0 && height > 0) return width / height;

  const rawRatio = work.video_aspect_ratio ?? work.aspect_ratio;
  if (typeof rawRatio === 'string' && rawRatio.includes(':')) {
    const [ratioWidth, ratioHeight] = rawRatio.split(':').map(Number);
    if (ratioWidth > 0 && ratioHeight > 0) return ratioWidth / ratioHeight;
  }

  const numericRatio = Number(rawRatio);
  return Number.isFinite(numericRatio) && numericRatio > 0 ? numericRatio : 16 / 9;
}

export function resolveDouyinPlayerSize(work = {}) {
  const mediaRatio = resolveDouyinAspectRatio(work);
  const mediaHeight = DOUYIN_PLAYER_WIDTH / mediaRatio;
  return {
    width: DOUYIN_PLAYER_WIDTH,
    height: mediaHeight,
    mediaHeight,
    ratio: mediaRatio,
  };
}
