export function douyinPlayerUrl(videoId = '') {
  return videoId
    ? `https://open.douyin.com/player/video?vid=${encodeURIComponent(videoId)}&autoplay=1`
    : '';
}

export const douyinFallbackFrameStyle = {
  top: '-48px',
  left: '-12%',
  width: '152%',
  height: '1100px',
};

export const douyinStageStyle = {
  maxWidth: '896px',
  aspectRatio: '16 / 9',
};
