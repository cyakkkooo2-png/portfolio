import test from 'node:test';
import assert from 'node:assert/strict';

import { douyinFallbackFrameStyle, douyinPlayerUrl, douyinStageStyle } from '../src/utils/douyin-player.js';

test('builds the official autoplay fallback URL from a video id', () => {
  assert.equal(
    douyinPlayerUrl('7271207882144632122'),
    'https://open.douyin.com/player/video?vid=7271207882144632122&autoplay=1',
  );
});

test('uses a portrait detail layout that matches the complete Douyin video', () => {
  assert.deepEqual(douyinStageStyle, {
    maxWidth: '520px',
    aspectRatio: '3 / 4',
  });
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
