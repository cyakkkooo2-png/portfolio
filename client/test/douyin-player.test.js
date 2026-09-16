import test from 'node:test';
import assert from 'node:assert/strict';

import { douyinFallbackFrameStyle, douyinPlayerUrl, douyinStageStyle } from '../src/utils/douyin-player.js';

test('builds the official autoplay fallback URL from a video id', () => {
  assert.equal(
    douyinPlayerUrl('7271207882144632122'),
    'https://open.douyin.com/player/video?vid=7271207882144632122&autoplay=1',
  );
});

test('uses the same standard detail layout as every other video', () => {
  assert.deepEqual(douyinStageStyle, {
    maxWidth: '896px',
    aspectRatio: '16 / 9',
  });
});

test('crops only the official page gutter without scaling the video', () => {
  assert.deepEqual(douyinFallbackFrameStyle, {
    top: '-48px',
    left: '0',
    width: '152%',
    height: '1100px',
  });
});
