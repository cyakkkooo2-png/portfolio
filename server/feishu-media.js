const { extractFeishuTitle, isFeishuFileUrl } = require('./feishu-url');

const FEISHU_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const sessionCache = new Map();

function extractFeishuToken(url = '') {
  try {
    if (!isFeishuFileUrl(url)) return '';
    return new URL(String(url)).pathname.match(/^\/file\/([0-9A-Za-z_-]+)/i)?.[1] || '';
  } catch {
    return '';
  }
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const combined = headers.get('set-cookie') || '';
  return combined ? combined.split(/,(?=\s*[^;,=]+=[^;,]+)/g) : [];
}

function updateCookieJar(jar, headers) {
  for (const cookie of getSetCookies(headers)) {
    const pair = String(cookie).split(';', 1)[0];
    const separator = pair.indexOf('=');
    if (separator <= 0) continue;
    jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function fetchFeishuPage(url) {
  if (!isFeishuFileUrl(url)) throw new Error('Not a Feishu file URL');
  const token = extractFeishuToken(url);
  const cached = sessionCache.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const jar = new Map();
  let currentUrl = String(url);
  let response;
  for (let redirects = 0; redirects < 12; redirects += 1) {
    response = await fetch(currentUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': FEISHU_UA,
        Accept: 'text/html,application/xhtml+xml',
        ...(jar.size ? { Cookie: cookieHeader(jar) } : {}),
      },
    });
    updateCookieJar(jar, response.headers);
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    if (!location) break;
    currentUrl = new URL(location, currentUrl).toString();
  }

  if (!response?.ok) throw new Error(`飞书公开页面读取失败 (${response?.status || 502})`);
  const html = await response.text();
  const session = {
    token,
    title: extractFeishuTitle(html),
    html,
    pageUrl: String(url),
    finalUrl: currentUrl,
    cookie: cookieHeader(jar),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  sessionCache.set(token, session);
  return session;
}

function feishuOriginalVideoUrl(token) {
  return `https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/all/${encodeURIComponent(token)}/?mount_point=explorer`;
}

function buildFeishuStreamHeaders(session, { range = '', accept = '' } = {}) {
  return {
    'User-Agent': FEISHU_UA,
    Accept: accept || 'video/mp4,video/*;q=0.9,*/*;q=0.8',
    Referer: session.pageUrl,
    Cookie: session.cookie,
    ...(String(range).trim() ? { Range: String(range).trim() } : {}),
  };
}

module.exports = {
  buildFeishuStreamHeaders,
  extractFeishuToken,
  feishuOriginalVideoUrl,
  fetchFeishuPage,
};
