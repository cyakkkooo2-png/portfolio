import test from 'node:test';
import assert from 'node:assert/strict';

import { splitImageWorksByOrientation } from '../src/utils/image-layout.js';

test('places landscape images before portrait images and keeps unknown images separate', () => {
  const works = [
    { id: 'portrait', image_aspect_ratio: 0.75 },
    { id: 'landscape', image_aspect_ratio: 16 / 9 },
    { id: 'measured-later' },
    { id: 'unknown' },
  ];
  const groups = splitImageWorksByOrientation(works, { 'measured-later': 3 / 4 });

  assert.deepEqual(groups.landscape.map((work) => work.id), ['landscape']);
  assert.deepEqual(groups.portrait.map((work) => work.id), ['portrait', 'measured-later']);
  assert.deepEqual(groups.unknown.map((work) => work.id), ['unknown']);
});
