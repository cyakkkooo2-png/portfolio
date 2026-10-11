import test from 'node:test';
import assert from 'node:assert/strict';
import { FALLBACK_LINK_TEXT, safeFeishuFallbackUrl } from './work-description.js';

test('accepts a Feishu file fallback link', () => {
  assert.equal(
    safeFeishuFallbackUrl({ fallback_url: 'https://my.feishu.cn/file/JEMfbQuVdoYSbtxocRwcoxb9nld' }),
    'https://my.feishu.cn/file/JEMfbQuVdoYSbtxocRwcoxb9nld',
  );
});

test('rejects a non-Feishu fallback link', () => {
  assert.equal(safeFeishuFallbackUrl({ fallback_url: 'https://example.com/video.mp4' }), '');
});

test('uses the requested fallback link text', () => {
  assert.equal(FALLBACK_LINK_TEXT, '视频卡顿请点这里');
});
