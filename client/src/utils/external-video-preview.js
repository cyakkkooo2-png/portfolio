export function isDouyinWork(work = {}) {
  const source = `${work.external_url || ''} ${work.source_url || ''} ${(work.tags || []).join(' ')}`;
  return Boolean(work.douyin_video_uri) || /douyin\.com|iesdouyin\.com|抖音/i.test(source);
}

export function isFeishuWork(work = {}) {
  const candidates = [work.external_url, work.source_url, work.file_path];
  return candidates.some((candidate) => {
    try {
      const parsed = new URL(String(candidate || ''));
      return /(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/i.test(parsed.hostname)
        && /^\/file\/[0-9A-Za-z_-]+/i.test(parsed.pathname);
    } catch {
      return false;
    }
  });
}

export function externalVideoPreviewSrc(work = {}) {
  if (work.type !== 'video' || work.thumbnail || !work.id) return '';
  if (isDouyinWork(work)) return `/api/works/${work.id}/douyin-video`;
  if (isFeishuWork(work)) return `/api/works/${work.id}/feishu-video`;
  return '';
}

function isTencentVodUrl(url = '') {
  return /^https?:\/\/[^/]+\.(?:vod2\.myqcloud\.com|vod-qcloud\.com|vod\.tencent-cloud\.com)(?:\/|$)/i.test(url);
}

export function videoMetadataSrc(work = {}) {
  if (work.type !== 'video') return '';
  if (isDouyinWork(work) && work.id && !work.file_path) return `/api/works/${work.id}/douyin-video`;
  if (isFeishuWork(work) && work.id && !work.file_path) return `/api/works/${work.id}/feishu-video`;
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
