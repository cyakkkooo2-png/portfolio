import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARTICLE_FALLBACK_LINK_TEXT,
  FALLBACK_LINK_TEXT,
  safeArticleOriginalUrl,
  safeFeishuFallbackUrl,
  safeVideoFallbackUrl,
} from './work-description.js';

test('accepts a Feishu file fallback link', () => {
  assert.equal(
    safeFeishuFallbackUrl({ fallback_url: 'https://my.feishu.cn/file/JEMfbQuVdoYSbtxocRwcoxb9nld' }),
    'https://my.feishu.cn/file/JEMfbQuVdoYSbtxocRwcoxb9nld',
  );
});

test('rejects a non-Feishu fallback link', () => {
  assert.equal(safeFeishuFallbackUrl({ fallback_url: 'https://example.com/video.mp4' }), '');
});

test('uses the explicit Feishu fallback before a video source link', () => {
  assert.equal(
    safeVideoFallbackUrl({
      type: 'video',
      fallback_url: 'https://my.feishu.cn/file/JEMfbQuVdoYSbtxocRwcoxb9nld',
      external_url: 'https://www.bilibili.com/video/BV123',
    }),
    'https://my.feishu.cn/file/JEMfbQuVdoYSbtxocRwcoxb9nld',
  );
});

test('uses the original link for a non-local video', () => {
  assert.equal(
    safeVideoFallbackUrl({ type: 'video', external_url: 'https://www.douyin.com/video/123' }),
    'https://www.douyin.com/video/123',
  );
  assert.equal(
    safeVideoFallbackUrl({ type: 'video', source_url: 'https://www.bilibili.com/video/BV123' }),
    'https://www.bilibili.com/video/BV123',
  );
});

test('does not expose local files, unsafe links, or non-video links', () => {
  assert.equal(safeVideoFallbackUrl({ type: 'video', file_path: '/uploads/local.mp4' }), '');
  assert.equal(safeVideoFallbackUrl({ type: 'video', external_url: 'javascript:alert(1)' }), '');
  assert.equal(safeVideoFallbackUrl({ type: 'article', external_url: 'https://example.com/article' }), '');
});

test('uses the requested fallback link text', () => {
  assert.equal(FALLBACK_LINK_TEXT, '视频卡顿请点这里');
});

test('accepts an article original URL and rejects unsafe schemes', () => {
  assert.equal(
    safeArticleOriginalUrl({ type: 'article', external_url: 'https://example.com/article' }),
    'https://example.com/article',
  );
  assert.equal(safeArticleOriginalUrl({ type: 'article', external_url: 'javascript:alert(1)' }), '');
  assert.equal(safeArticleOriginalUrl({ type: 'video', external_url: 'https://example.com/article' }), '');
  assert.equal(ARTICLE_FALLBACK_LINK_TEXT, '文章卡顿请点这里');
});
