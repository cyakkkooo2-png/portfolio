function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function isFeishuFileUrl(url = '') {
  try {
    const parsed = new URL(String(url));
    return /(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/i.test(parsed.hostname)
      && /^\/file\/[0-9A-Za-z_-]+/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function extractFeishuTitle(html = '') {
  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ];
  for (const pattern of patterns) {
    const value = pattern.exec(html)?.[1];
    if (value) return decodeHtml(value).replace(/\s*-\s*飞书云文档\s*$/i, '').trim();
  }
  return '';
}

module.exports = { extractFeishuTitle, isFeishuFileUrl };
