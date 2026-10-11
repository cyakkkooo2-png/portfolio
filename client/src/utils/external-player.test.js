import test from 'node:test';
import assert from 'node:assert/strict';

import { bilibiliPlayerSrc, feishuPlayerSrc } from './external-player.js';

test('builds an embedded Bilibili player URL from a BV link', () => {
  const src = bilibiliPlayerSrc({
    type: 'video',
    source_url: 'https://www.bilibili.com/video/BV1414y1L7f1/',
  });
  assert.match(src, /^https:\/\/player\.bilibili\.com\/player\.html\?/);
  assert.match(src, /bvid=BV1414y1L7f1/);
  assert.match(src, /autoplay=0/);
});

test('keeps a public Feishu file page as the embedded player URL', () => {
  const url = 'https://my.feishu.cn/file/C2eDbUTzroxTf3x4bsfcvkhMnTd';
  assert.equal(feishuPlayerSrc({ source_url: url }), url);
});

test('does not embed an arbitrary Feishu page', () => {
  assert.equal(feishuPlayerSrc({ source_url: 'https://my.feishu.cn/drive/me/' }), '');
});
