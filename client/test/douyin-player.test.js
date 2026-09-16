import test from 'node:test';
import assert from 'node:assert/strict';

import {
  douyinFallbackFrameStyle,
  douyinPlayerUrl,
  douyinPortraitFrameStyle,
  douyinStageStyle,
} from '../src/utils/douyin-player.js';

test('builds the official autoplay fallback URL from a video id', () => {
  assert.equal(
    douyinPlayerUrl('7271207882144632122'),
    'https://open.douyin.com/player/video?vid=7271207882144632122&autoplay=1',
  );
});

test('uses a wide stage with a centered 9:16 portrait frame', () => {
  assert.equal(douyinStageStyle.aspectRatio, '16 / 9');
  assert.equal(douyinStageStyle.width, 'min(96vw, 1180px, calc(90dvh * 16 / 9))');
  assert.deepEqual(douyinPortraitFrameStyle, {
    height: '100%',
    aspectRatio: '9 / 16',
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
