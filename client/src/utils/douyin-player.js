export function douyinPlayerUrl(videoId = '') {
  return videoId
    ? `https://open.douyin.com/player/video?vid=${encodeURIComponent(videoId)}&autoplay=1`
    : '';
}

export const douyinFallbackFrameStyle = {
  top: '-48px',
  left: '0',
  width: '100%',
  height: 'calc(100% + 48px)',
};

export const douyinStageStyle = {
  maxWidth: '520px',
  aspectRatio: '9 / 16',
};
