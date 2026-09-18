import test from 'node:test';
import assert from 'node:assert/strict';

import { externalVideoPreviewSrc, isDouyinWork } from './external-video-preview.js';

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
