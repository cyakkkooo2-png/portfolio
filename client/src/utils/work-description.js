export const FALLBACK_LINK_TEXT = '视频卡顿请点这里';

export function safeFeishuFallbackUrl(work = {}) {
  const url = String(work.fallback_url || '').trim();
  return /^https:\/\/[a-z0-9-]+\.feishu\.cn\/file\/[A-Za-z0-9_-]+(?:[?#].*)?$/i.test(url) ? url : '';
}
