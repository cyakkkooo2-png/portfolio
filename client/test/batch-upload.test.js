import test from 'node:test';
import assert from 'node:assert/strict';

import { batchTitleForFile, isDuplicateUploadError, shouldBatchUpload } from '../src/utils/batch-upload.js';

test('treats multiple selected images as a batch upload', () => {
  assert.equal(shouldBatchUpload('image', [{ name: 'one.jpg' }, { name: 'two.png' }]), true);
});

test('keeps a single image and article documents in the normal upload flow', () => {
  assert.equal(shouldBatchUpload('image', [{ name: 'one.jpg' }]), false);
  assert.equal(shouldBatchUpload('article', [{ name: 'one.pdf' }, { name: 'two.pdf' }]), false);
});

test('uses each batch file name as its work title', () => {
  assert.equal(batchTitleForFile({ name: '产品图.最终版.webp' }), '产品图.最终版');
});

test('only skips errors identified as duplicate works', () => {
  assert.equal(isDuplicateUploadError({ status: 409, code: 'DUPLICATE_WORK' }), true);
  assert.equal(isDuplicateUploadError({ status: 500, code: 'DUPLICATE_WORK' }), false);
  assert.equal(isDuplicateUploadError({ status: 409, code: 'UPLOAD_FAILED' }), false);
});
