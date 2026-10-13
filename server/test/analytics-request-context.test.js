const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveGeo } = require('../analytics/request-context');

test('falls back to a keyless IP lookup when no AMap key is configured', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.AMAP_IP_KEY;
  delete process.env.AMAP_IP_KEY;
  let requestedUrl = '';
  global.fetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      json: async () => ({
        success: true,
        region: '广东省',
        city: '广州市',
      }),
    };
  };

  try {
    const geo = await resolveGeo({
      headers: { 'x-forwarded-for': '113.108.10.1' },
      socket: { remoteAddress: '127.0.0.1' },
    });
    assert.match(requestedUrl, /^https:\/\/ipwho\.is\/113\.108\.10\.1/);
    assert.deepEqual(geo, {
      province: '广东省',
      city: '广州市',
      district: '',
      adcode: '',
    });
  } finally {
    global.fetch = originalFetch;
    if (originalKey == null) delete process.env.AMAP_IP_KEY;
    else process.env.AMAP_IP_KEY = originalKey;
  }
});
