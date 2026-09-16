const test = require('node:test');
const assert = require('node:assert/strict');

const { generateABogus } = require('../douyin-sign');

test('generates a Douyin web signature for a detail query', () => {
  const signature = generateABogus(
    'device_platform=webapp&aid=6383&channel=channel_pc_web&aweme_id=7271207882144632122&msToken=test',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
  );
  assert.match(signature, /^[A-Za-z0-9/+_-]{100,}=$/);
});
