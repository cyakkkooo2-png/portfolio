import test from 'node:test';
import assert from 'node:assert/strict';

import { douyinFallbackFrameStyle, douyinPlayerUrl } from '../src/utils/douyin-player.js';

test('builds the official autoplay fallback URL from a video id', () => {
  assert.equal(
    douyinPlayerUrl('7271207882144632122'),
    'https://open.douyin.com/player/video?vid=7271207882144632122&autoplay=1',
  );
});

test('scales the official player so its right gutter and bottom banner are clipped', () => {
  assert.deepEqual(douyinFallbackFrameStyle, {
    top: '-48px',
    left: '0',
    width: '100%',
    height: '1100px',
    transform: 'scale(1.52)',
    transformOrigin: 'top left',
  });
});
