const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractDouyinVideoId,
  extractDouyinMedia,
} = require('../douyin-media');

test('extracts a Douyin video id from canonical and player URLs', () => {
  assert.equal(extractDouyinVideoId('https://www.douyin.com/video/7484944907887463732'), '7484944907887463732');
  assert.equal(extractDouyinVideoId('https://open.douyin.com/player/video?vid=7589244246889155878'), '7589244246889155878');
});

test('extracts the real play URL and 3:4 ratio from snake-case metadata', () => {
  const html = `<script>{"aweme_detail":{"video":{"width":1080,"height":1440,"play_addr":{"uri":"stable-video-id","url_list":["https:\\/\\/video.example.com\\/play.mp4?x=1\\u0026y=2"]}}}}</script>`;
  assert.deepEqual(extractDouyinMedia(html), {
    url: 'https://video.example.com/play.mp4?x=1&y=2',
    width: 1080,
    height: 1440,
    ratio: 0.75,
    uri: 'stable-video-id',
  });
});

test('extracts camel-case metadata embedded in a page state script', () => {
  const html = `<script id="__DATA__" type="application/json">{"video":{"width":720,"height":1280,"playAddr":["https://cdn.example.com/video.mp4"]}}</script>`;
  assert.deepEqual(extractDouyinMedia(html), {
    url: 'https://cdn.example.com/video.mp4',
    width: 720,
    height: 1280,
    ratio: 0.5625,
  });
});

test('extracts landscape media from percent-encoded Douyin page state', () => {
  const state = encodeURIComponent(JSON.stringify({
    aweme: {
      aweme_id: '7281981187520777524',
      video: {
        width: 1280,
        height: 720,
        play_addr: {
          uri: 'v0300fg10000ck7clvrc77u5pj7nnkig',
          url_list: ['https://video.example.com/landscape.mp4'],
        },
      },
    },
  }));

  assert.deepEqual(extractDouyinMedia(`<script>${state}</script>`), {
    url: 'https://video.example.com/landscape.mp4',
    width: 1280,
    height: 720,
    ratio: 1.7778,
    uri: 'v0300fg10000ck7clvrc77u5pj7nnkig',
  });
});
