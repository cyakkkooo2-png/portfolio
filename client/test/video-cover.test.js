import test from 'node:test';
import assert from 'node:assert/strict';
import { captureVideoCover, isBlackFrame } from '../src/utils/video-cover.js';
import { selectVideoFiles } from '../src/utils/batch-upload.js';

test('video file selection preserves order and accepts missing MIME types by extension', () => {
  const files = [{ name: 'one.MOV', type: '' }, { name: 'cover.jpg', type: 'image/jpeg' }, { name: 'two.mp4', type: 'video/mp4' }];
  assert.deepEqual(selectVideoFiles(files), [files[0], files[2]]);
});

test('black frame detection preserves dark footage with visible detail', () => {
  assert.equal(isBlackFrame(new Uint8ClampedArray(400)), true);
  const dark = new Uint8ClampedArray(400);
  for (let i = 0; i < 12; i += 4) dark[i] = dark[i + 1] = dark[i + 2] = 80;
  assert.equal(isBlackFrame(dark), false);
});

function mockVideo(t, { duration = 4, visibleAt = 2, decodeError = false } = {}) {
  const seeks = [];
  let capturedAt;
  let revoked = false;
  let unloaded = false;
  const video = {
    duration, videoWidth: 1920, videoHeight: 1080,
    set src(value) { queueMicrotask(() => decodeError ? this.onerror?.() : this.onloadedmetadata?.()); },
    set currentTime(value) { this.time = value; seeks.push(value); queueMicrotask(() => this.onseeked?.()); },
    get currentTime() { return this.time; },
    removeAttribute() { unloaded = true; }, load() {},
  };
  t.mock.method(URL, 'createObjectURL', () => 'blob:test');
  t.mock.method(URL, 'revokeObjectURL', () => { revoked = true; });
  const previousDocument = globalThis.document;
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  globalThis.document = { createElement(tag) {
    if (tag === 'video') return video;
    return {
      width: 0, height: 0,
      getContext() { return {
        drawImage() {},
        getImageData() { return { data: new Uint8ClampedArray([...(video.time >= visibleAt ? [80, 80, 80] : [0, 0, 0]), 255]) }; },
      }; },
      toBlob(callback) { capturedAt = video.time; callback(new Blob(['jpeg'], { type: 'image/jpeg' })); },
    };
  } };
  return { seeks, capturedAt: () => capturedAt, cleaned: () => revoked && unloaded };
}

test('cover skips consecutive black frames and captures the first visible sampled frame', async (t) => {
  const media = mockVideo(t);
  const file = await captureVideoCover({ name: 'sample.mp4' });
  assert.deepEqual(media.seeks, [1, 1.5, 2]);
  assert.equal(media.capturedAt(), 2);
  assert.equal(file.name, 'sample-cover.jpg');
  assert.equal(media.cleaned(), true);
});

test('cover uses one second immediately when it has a picture', async (t) => {
  const media = mockVideo(t, { visibleAt: 0 });
  await captureVideoCover({ name: 'sample.mp4' });
  assert.deepEqual(media.seeks, [1]);
});

test('short clips are sampled inside their duration', async (t) => {
  const media = mockVideo(t, { duration: 0.3, visibleAt: 0 });
  await captureVideoCover({ name: 'short.mp4' });
  assert.deepEqual(media.seeks, [0.15]);
});

test('all-black clips request a manual cover and release resources', async (t) => {
  const media = mockVideo(t, { duration: 2, visibleAt: Infinity });
  await assert.rejects(captureVideoCover({ name: 'black.mp4' }), /未找到有画面/);
  assert.ok(media.seeks.every((time) => time < 2));
  assert.equal(media.cleaned(), true);
});

test('decode errors release video resources', async (t) => {
  const media = mockVideo(t, { decodeError: true });
  await assert.rejects(captureVideoCover({ name: 'bad.mp4' }), /无法读取/);
  assert.equal(media.cleaned(), true);
});
