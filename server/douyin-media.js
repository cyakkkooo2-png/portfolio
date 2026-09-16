function extractDouyinVideoId(value = '') {
  const source = String(value);
  return source.match(/douyin\.com\/video\/(\d+)/i)?.[1]
    || source.match(/[?&](?:modal_id|vid|item_ids)=(\d+)/i)?.[1]
    || '';
}

function decodeUrl(value = '') {
  return String(value)
    .replace(/&amp;/gi, '&')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u003d/gi, '=')
    .replace(/\\u002[fF]/g, '/')
    .replace(/\\\//g, '/')
    .trim();
}

function firstHttpUrl(value) {
  if (typeof value === 'string') {
    const url = decodeUrl(value);
    return /^https?:\/\//i.test(url) ? url : '';
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstHttpUrl(item);
      if (url) return url;
    }
    return '';
  }
  if (!value || typeof value !== 'object') return '';

  for (const key of ['url_list', 'urlList', 'urls', 'src', 'url']) {
    const url = firstHttpUrl(value[key]);
    if (url) return url;
  }
  for (const child of Object.values(value)) {
    const url = firstHttpUrl(child);
    if (url) return url;
  }
  return '';
}

function mediaFromObject(root) {
  const queue = [root];
  const visited = new Set();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== 'object' || visited.has(value)) continue;
    visited.add(value);

    const playValue = value.play_addr
      || value.playAddr
      || value.play_addr_h264
      || value.playAddrH264
      || value.playApi;
    const url = firstHttpUrl(playValue);
    if (url) {
      const width = Number(value.width || value.video_width || value.videoWidth) || 0;
      const height = Number(value.height || value.video_height || value.videoHeight) || 0;
      const ratio = width && height ? Number((width / height).toFixed(4)) : null;
      return { url, width, height, ratio };
    }

    if (Array.isArray(value)) queue.push(...value);
    else queue.push(...Object.values(value));
  }
  return null;
}

function parseJsonCandidates(html = '') {
  const candidates = [String(html)];
  for (const match of String(html).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = match[1].trim();
    if (!body) continue;
    candidates.push(body);
    if (/^%7B/i.test(body)) {
      try { candidates.push(decodeURIComponent(body)); } catch { /* ignore malformed state */ }
    }
  }

  const parsed = [];
  for (const candidate of candidates) {
    try {
      parsed.push(JSON.parse(candidate));
      continue;
    } catch { /* a full HTML page is not JSON */ }

    const objectText = candidate.match(/(?:window\.__INITIAL_STATE__|window\._ROUTER_DATA|self\.__pace_f)\s*=\s*(\{[\s\S]*\})\s*;?\s*$/)?.[1];
    if (objectText) {
      try { parsed.push(JSON.parse(objectText)); } catch { /* fallback regex handles it */ }
    }
  }
  return parsed;
}

function extractDouyinMedia(html = '') {
  for (const data of parseJsonCandidates(html)) {
    const media = mediaFromObject(data);
    if (media) return media;
  }

  const source = String(html);
  const playMatch = source.match(/"(?:play_addr|playAddr|play_addr_h264|playAddrH264|playApi)"\s*:\s*(?:\{[\s\S]{0,2500}?"(?:url_list|urlList|url|src)"\s*:\s*\[?\s*)?"((?:\\.|[^"\\])+)"/i);
  const url = decodeUrl(playMatch?.[1] || '');
  if (!/^https?:\/\//i.test(url)) return null;

  const around = source.slice(Math.max(0, (playMatch?.index || 0) - 2500), (playMatch?.index || 0) + 3500);
  const dimensions = around.match(/"width"\s*:\s*(\d+)[\s\S]{0,800}?"height"\s*:\s*(\d+)/i)
    || around.match(/"height"\s*:\s*(\d+)[\s\S]{0,800}?"width"\s*:\s*(\d+)/i);
  let width = Number(dimensions?.[1]) || 0;
  let height = Number(dimensions?.[2]) || 0;
  if (dimensions && /"height"\s*:/.test(dimensions[0].slice(0, 20))) [width, height] = [height, width];
  return {
    url,
    width,
    height,
    ratio: width && height ? Number((width / height).toFixed(4)) : null,
  };
}

module.exports = {
  extractDouyinVideoId,
  extractDouyinMedia,
};
