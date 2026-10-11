export const FALLBACK_LINK_TEXT = '视频卡顿请点这里';
export const FEISHU_WORKS_HELP_URL = 'https://my.feishu.cn/wiki/ExtzwJzADiUUzukYoFwc1Z91n7c';

export function safeFeishuFallbackUrl(work = {}) {
  const url = String(work.fallback_url || '').trim();
  return /^https:\/\/[a-z0-9-]+\.feishu\.cn\/file\/[A-Za-z0-9_-]+(?:[?#].*)?$/i.test(url) ? url : '';
}
