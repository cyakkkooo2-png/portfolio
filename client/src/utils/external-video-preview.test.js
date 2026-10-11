import test from 'node:test';
import assert from 'node:assert/strict';

import { externalVideoPreviewSrc, formatVideoDuration, isDouyinWork, isFeishuWork, videoMetadataSrc } from './external-video-preview.js';

test('uses an imported Douyin video as its own thumbnail when no cover exists', () => {
  const work = {
    id: 'work-1',
    type: 'video',
    source_url: 'https://www.douyin.com/video/123',
    thumbnail: '',
  };
  assert.equal(isDouyinWork(work), true);
  assert.equal(externalVideoPreviewSrc(work), '/api/works/work-1/douyin-video');
});

test('keeps an existing cover instead of loading the video preview', () => {
  assert.equal(externalVideoPreviewSrc({
    id: 'work-1',
    type: 'video',
    tags: ['抖音'],
    thumbnail: '/uploads/images/cover.jpg',
  }), '');
});

test('uses the same-origin video endpoint for Douyin duration metadata', () => {
  assert.equal(videoMetadataSrc({
    id: 'work-2',
    type: 'video',
    tags: ['抖音'],
  }), '/api/works/work-2/douyin-video');
});

test('uses the site player endpoints for a public Feishu file', () => {
  const work = {
    id: 'work-feishu',
    type: 'video',
    source_url: 'https://my.feishu.cn/file/BWRTbxFlEoL5AYxRMrfca9CNngg',
  };
  assert.equal(isFeishuWork(work), true);
  assert.equal(externalVideoPreviewSrc(work), '/api/works/work-feishu/feishu-video');
  assert.equal(videoMetadataSrc(work), '/api/works/work-feishu/feishu-video');
});

test('formats short and long video durations', () => {
  assert.equal(formatVideoDuration(41.9), '00:41');
  assert.equal(formatVideoDuration(3725), '1:02:05');
});
