export function douyinPlayerUrl(videoId = '') {
  return videoId
    ? `https://open.douyin.com/player/video?vid=${encodeURIComponent(videoId)}&autoplay=1`
    : '';
}

export const douyinFallbackFrameStyle = {
  top: '-259px',
  left: '-50px',
  width: '100%',
  height: 'calc(100% + 259px)',
  transform: 'scale(1.93)',
  transformOrigin: 'top left',
};

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
  return Number.isFinite(numericRatio) && numericRatio > 0 ? numericRatio : 9 / 16;
}
