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

export const douyinStageStyle = {
  width: 'min(96vw, 1180px, calc(90dvh * 16 / 9))',
  maxHeight: '90dvh',
  aspectRatio: '16 / 9',
};

export const douyinPortraitFrameStyle = {
  height: '100%',
  aspectRatio: '9 / 16',
};
