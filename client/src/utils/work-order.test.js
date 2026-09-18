import test from 'node:test';
import assert from 'node:assert/strict';

import { moveSelectedWorksToBottom } from './work-order.js';

test('moves selected works to the bottom while preserving page order', () => {
  const works = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
  const result = moveSelectedWorksToBottom(works, ['c', 'a']);

  assert.deepEqual(result.map((work) => work.id), ['b', 'd', 'a', 'c']);
});

test('ignores selected ids that are not on the page', () => {
  const works = ['a', 'b'].map((id) => ({ id }));
  assert.deepEqual(
    moveSelectedWorksToBottom(works, ['missing']).map((work) => work.id),
    ['a', 'b']
  );
});
