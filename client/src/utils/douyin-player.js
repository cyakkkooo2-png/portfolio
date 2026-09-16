export function douyinPlayerUrl(videoId = '') {
  return videoId
    ? `https://open.douyin.com/player/video?vid=${encodeURIComponent(videoId)}&autoplay=1`
    : '';
}

export const douyinFallbackFrameStyle = {
  top: '-48px',
  left: '0',
  width: '100%',
  height: '1100px',
  transform: 'scale(1.52)',
  transformOrigin: 'top left',
};
