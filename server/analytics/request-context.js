const crypto = require('crypto');

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, pair) => {
    const index = pair.indexOf('=');
    if (index < 0) return cookies;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function clientIp(req) {
  const trusted = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return trusted || req.socket?.remoteAddress || '';
}

function hashNetwork(ip) {
  if (!ip) return '';
  const salt = process.env.ANALYTICS_IP_SALT || 'replace-this-analytics-salt';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex').slice(0, 24);
}

function userAgentInfo(agent = '') {
  const lower = agent.toLowerCase();
  const deviceType = /mobile|android|iphone|ipad/.test(lower) ? 'mobile' : 'desktop';
  const browserFamily = /edg\//.test(lower) ? 'Edge' : /chrome\//.test(lower) ? 'Chrome' : /firefox\//.test(lower) ? 'Firefox' : /safari\//.test(lower) ? 'Safari' : 'Other';
  const osFamily = /windows/.test(lower) ? 'Windows' : /android/.test(lower) ? 'Android' : /iphone|ipad|ios/.test(lower) ? 'iOS' : /mac os/.test(lower) ? 'macOS' : /linux/.test(lower) ? 'Linux' : 'Other';
  const isBot = /bot|crawler|spider|headless|lighthouse/.test(lower);
  return { deviceType, browserFamily, osFamily, isBot };
}

function referrerHost(value = '') {
  try { return value ? new URL(value).hostname.slice(0, 200) : ''; } catch { return ''; }
}

async function resolveGeo(req) {
  const fromHeaders = {
    province: req.headers['x-geo-province'] || '',
    city: req.headers['x-geo-city'] || req.headers['cf-ipcity'] || '',
    district: req.headers['x-geo-district'] || '',
    adcode: req.headers['x-geo-adcode'] || '',
  };
  if (fromHeaders.city) return fromHeaders;

  const key = process.env.AMAP_IP_KEY;
  const ip = clientIp(req).replace(/^::ffff:/, '');
  if (!key || !ip || ip === '127.0.0.1' || ip === '::1') return {};
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const response = await fetch(`https://restapi.amap.com/v3/ip?key=${encodeURIComponent(key)}&ip=${encodeURIComponent(ip)}`, { signal: controller.signal });
    clearTimeout(timer);
    const data = await response.json();
    if (data.status !== '1') return {};
    return {
      province: Array.isArray(data.province) ? '' : String(data.province || '').slice(0, 40),
      city: Array.isArray(data.city) ? '' : String(data.city || '').slice(0, 40),
      district: '',
      adcode: String(data.adcode || '').slice(0, 20),
    };
  } catch { return {}; }
}

module.exports = { parseCookies, clientIp, hashNetwork, userAgentInfo, referrerHost, resolveGeo };
