const test = require('node:test');
const assert = require('node:assert/strict');

const {
  bilibiliFallbackTitle,
  extractBilibiliIds,
  isBilibiliUrl,
  shouldFetchBilibiliPage,
} = require('../bilibili-url');

test('recognizes a canonical Bilibili BV link without fetching its blocked page', () => {
  const url = 'https://www.bilibili.com/video/BV1414y1L7f1/?spm_id_from=333.1387.upload.video_card.click';
  assert.equal(isBilibiliUrl(url), true);
  assert.deepEqual(extractBilibiliIds(url), { bvid: 'BV1414y1L7f1', aid: undefined });
  assert.equal(shouldFetchBilibiliPage(url), false);
  assert.equal(bilibiliFallbackTitle(url), 'B站视频 BV1414y1L7f1');
});

test('still fetches a Bilibili short link so its target id can be resolved', () => {
  assert.equal(isBilibiliUrl('https://b23.tv/abc123'), true);
  assert.equal(shouldFetchBilibiliPage('https://b23.tv/abc123'), true);
});
