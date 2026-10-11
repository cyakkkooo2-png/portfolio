const test = require('node:test');
const assert = require('node:assert/strict');

const { extractFeishuTitle, isFeishuFileUrl } = require('../feishu-url');

test('recognizes a Feishu file page but not a login redirect', () => {
  assert.equal(isFeishuFileUrl('https://my.feishu.cn/file/UnHgbz9vzoDj7CxZF6Cci6S9n9g'), true);
  assert.equal(isFeishuFileUrl('https://accounts.feishu.cn/accounts/page/login?app_id=2'), false);
});

test('extracts the original filename from Feishu Open Graph metadata', () => {
  const html = '<meta content="游戏馆探店（终.mp4" property="og:title"><title>游戏馆探店（终.mp4 - 飞书云文档</title>';
  assert.equal(extractFeishuTitle(html), '游戏馆探店（终.mp4');
});
