export function isDouyinWork(work = {}) {
  const source = `${work.external_url || ''} ${work.source_url || ''} ${(work.tags || []).join(' ')}`;
  return Boolean(work.douyin_video_uri) || /douyin\.com|iesdouyin\.com|抖音/i.test(source);
}

export function externalVideoPreviewSrc(work = {}) {
  if (work.type !== 'video' || work.thumbnail || !isDouyinWork(work) || !work.id) return '';
  return `/api/works/${work.id}/douyin-video`;
}
