import test from 'node:test';
import assert from 'node:assert/strict';

import {
  douyinFallbackFrameStyle,
  douyinPlayerUrl,
  douyinStageStyle,
  resolveDouyinAspectRatio,
  resolveDouyinPlayerSize,
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

test('crops the official embed to the source video canvas', () => {
  const player = resolveDouyinPlayerSize({ video_width: 1080, video_height: 1920 });
  assert.deepEqual(player, {
    width: 324,
    height: 672,
    mediaHeight: 576,
    cropTop: 24,
    ratio: 9 / 16,
  });
  assert.deepEqual(douyinFallbackFrameStyle(1.5, player.height, player.cropTop), {
    top: '-36px',
    left: '0',
    width: '324px',
    height: '720px',
    transform: 'scale(1.5)',
    transformOrigin: 'top left',
  });
});
