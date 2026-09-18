import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('video duration is rendered as white text without a background badge', () => {
  const source = fs.readFileSync(new URL('./WorksGrid.jsx', import.meta.url), 'utf8');
  const durationClass = source.match(/<span className="([^"]*tabular-nums[^"]*)">/);

  assert.ok(durationClass, 'duration label should use tabular numerals');
  assert.match(durationClass[1], /text-white/);
  assert.doesNotMatch(durationClass[1], /bg-/);
});
