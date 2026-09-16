import test from 'node:test';
import assert from 'node:assert/strict';

import {
  douyinFallbackFrameStyle,
  douyinPlayerUrl,
  douyinStageStyle,
  resolveDouyinAspectRatio,
} from '../src/utils/douyin-player.js';

test('builds the official autoplay fallback URL from a video id', () => {
  assert.equal(
    douyinPlayerUrl('7271207882144632122'),
    'https://open.douyin.com/player/video?vid=7271207882144632122&autoplay=1',
  );
});

test('keeps only a width cap instead of forcing every Douyin video to 3:4', () => {
  assert.deepEqual(douyinStageStyle, {
    maxWidth: '520px',
  });
});

test('uses stored video dimensions and falls back to the usual vertical ratio', () => {
  assert.equal(resolveDouyinAspectRatio({ video_width: 1080, video_height: 1920 }), 9 / 16);
  assert.equal(resolveDouyinAspectRatio({ video_aspect_ratio: '3:4' }), 3 / 4);
  assert.equal(resolveDouyinAspectRatio({}), 9 / 16);
});

test('fills the portrait stage while cropping only the official page chrome', () => {
  assert.deepEqual(douyinFallbackFrameStyle, {
    top: '-259px',
    left: '-50px',
    width: '100%',
    height: 'calc(100% + 259px)',
    transform: 'scale(1.93)',
    transformOrigin: 'top left',
  });
});
