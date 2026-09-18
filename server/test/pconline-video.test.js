const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isPconlineVideoUrl,
  normalizePconlineVideoUrl,
  pconlineVideoId,
} = require('../pconline-video');

test('recognizes current and legacy PConline video page URLs', () => {
  assert.equal(pconlineVideoId('https://v.pconline.com.cn/video-34076.html'), '34076');
  assert.equal(pconlineVideoId('https://pconline.pcvideo.com.cn/video-34076.html'), '34076');
  assert.equal(pconlineVideoId('https://mpconline.pcvideo.com.cn/34076.html'), '34076');
  assert.equal(isPconlineVideoUrl('https://v.pconline.com.cn/video-34076.html'), true);
});

test('normalizes PConline video pages to the extractable mobile page', () => {
  assert.equal(
    normalizePconlineVideoUrl('https://v.pconline.com.cn/video-34076.html'),
    'https://mpconline.pcvideo.com.cn/34076.html'
  );
});
