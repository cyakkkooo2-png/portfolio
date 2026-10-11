function sourceUrl(work = {}) {
  return String(work.external_url || work.source_url || work.file_path || '').trim();
}

export function bilibiliPlayerSrc(work = {}) {
  const source = `${sourceUrl(work)} ${(work.tags || []).join(' ')}`;
  if (!/bilibili\.com|b23\.tv|B站/i.test(source)) return '';
  const bvid = source.match(/BV[0-9A-Za-z]{10}/i)?.[0];
  const aid = source.match(/(?:\/video\/av|[?&]aid=)(\d+)/i)?.[1];
  if (!bvid && !aid) return '';
  const id = bvid ? `bvid=${encodeURIComponent(bvid)}` : `aid=${encodeURIComponent(aid)}`;
  return `https://player.bilibili.com/player.html?isOutside=true&${id}&p=1&autoplay=0&high_quality=1&danmaku=1`;
}

export function feishuPlayerSrc(work = {}) {
  const candidates = [work.source_url, work.external_url, work.file_path];
  for (const candidate of candidates) {
    try {
      const parsed = new URL(String(candidate || ''));
      const isFeishu = /(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/i.test(parsed.hostname);
      if (isFeishu && /^\/file\/[0-9A-Za-z_-]+/i.test(parsed.pathname)) return parsed.href;
    } catch {
      // Try the next saved URL. Imported records may also contain a login redirect.
    }
  }
  return '';
}
