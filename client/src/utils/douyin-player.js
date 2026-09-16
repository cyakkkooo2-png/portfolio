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
  aspectRatio: '3 / 4',
};
