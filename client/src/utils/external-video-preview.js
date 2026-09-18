export function isDouyinWork(work = {}) {
  const source = `${work.external_url || ''} ${work.source_url || ''} ${(work.tags || []).join(' ')}`;
  return Boolean(work.douyin_video_uri) || /douyin\.com|iesdouyin\.com|抖音/i.test(source);
}

export function externalVideoPreviewSrc(work = {}) {
  if (work.type !== 'video' || work.thumbnail || !isDouyinWork(work) || !work.id) return '';
  return `/api/works/${work.id}/douyin-video`;
}

function isTencentVodUrl(url = '') {
  return /^https?:\/\/[^/]+\.(?:vod2\.myqcloud\.com|vod-qcloud\.com|vod\.tencent-cloud\.com)(?:\/|$)/i.test(url);
}

export function videoMetadataSrc(work = {}) {
  if (work.type !== 'video') return '';
  if (isDouyinWork(work) && work.id && !work.file_path) return `/api/works/${work.id}/douyin-video`;
  const url = String(work.file_path || '');
  if (!url) return '';
  if (url.startsWith('/uploads/') || isTencentVodUrl(url)) return url;
  if (/^https?:\/\//i.test(url)) return `/api/works/proxy-video?url=${encodeURIComponent(url)}`;
  return url;
}

export function formatVideoDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}
