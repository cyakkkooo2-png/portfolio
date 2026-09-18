import test from 'node:test';
import assert from 'node:assert/strict';

import {
  douyinStageStyle,
  resolveDouyinAspectRatio,
  resolveDouyinPlayerSize,
} from '../src/utils/douyin-player.js';

test('keeps only a width cap instead of forcing every Douyin video to 3:4', () => {
  assert.deepEqual(douyinStageStyle, {
    maxWidth: '520px',
  });
});

test('uses the saved 1920x1080 dimensions for a landscape Douyin video', () => {
  assert.equal(resolveDouyinAspectRatio({ video_width: 1920, video_height: 1080 }), 16 / 9);
});

test('does not force a Douyin video into portrait mode when its ratio is not saved', () => {
  assert.equal(resolveDouyinAspectRatio({ video_width: 1080, video_height: 1920 }), 9 / 16);
  assert.equal(resolveDouyinAspectRatio({ video_aspect_ratio: '3:4' }), 3 / 4);
  assert.equal(resolveDouyinAspectRatio({}), 16 / 9);
});

test('sizes the stage to the complete source video canvas', () => {
  const player = resolveDouyinPlayerSize({ video_width: 1080, video_height: 1920 });
  assert.deepEqual(player, {
    width: 324,
    height: 576,
    mediaHeight: 576,
    ratio: 9 / 16,
  });
});
