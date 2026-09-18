function isBilibiliUrl(url = '') {
  return /(^|\.)bilibili\.com|b23\.tv/i.test(String(url));
}

function extractBilibiliIds(inputUrl = '', html = '') {
  const source = `${inputUrl}\n${html}`;
  const bvid = source.match(/BV[0-9A-Za-z]{10}/i)?.[0];
  const aid = source.match(/(?:\/video\/av|[?&]aid=|["']aid["']\s*:\s*)(\d+)/i)?.[1];
  return { bvid, aid };
}

function shouldFetchBilibiliPage(url = '') {
  if (!isBilibiliUrl(url)) return true;
  const { bvid, aid } = extractBilibiliIds(url);
  return !bvid && !aid;
}

function bilibiliFallbackTitle(url = '', html = '') {
  const { bvid, aid } = extractBilibiliIds(url, html);
  return `B站视频 ${bvid || aid || ''}`.trim();
}

module.exports = {
  bilibiliFallbackTitle,
  extractBilibiliIds,
  isBilibiliUrl,
  shouldFetchBilibiliPage,
};
