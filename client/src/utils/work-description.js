export const FALLBACK_LINK_TEXT = '视频卡顿请点这里';
export const ARTICLE_FALLBACK_LINK_TEXT = '文章卡顿请点这里';
export const FEISHU_WORKS_HELP_URL = 'https://my.feishu.cn/wiki/ExtzwJzADiUUzukYoFwc1Z91n7c';

export function safeFeishuFallbackUrl(work = {}) {
  const url = String(work.fallback_url || '').trim();
  return /^https:\/\/[a-z0-9-]+\.feishu\.cn\/file\/[A-Za-z0-9_-]+(?:[?#].*)?$/i.test(url) ? url : '';
}

export function safeVideoFallbackUrl(work = {}) {
  if (work.type !== 'video') return '';

  const explicitFallback = safeFeishuFallbackUrl(work);
  if (explicitFallback) return explicitFallback;

  const originalUrl = String(work.external_url || work.source_url || '').trim();
  return /^https?:\/\/[^\s]+$/i.test(originalUrl) ? originalUrl : '';
}

export function safeArticleOriginalUrl(work = {}) {
  if (work.type !== 'article') return '';
  const url = String(work.external_url || work.source_url || '').trim();
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : '';
}
