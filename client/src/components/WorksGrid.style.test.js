import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('video duration is rendered as white text without a background badge', () => {
  const source = fs.readFileSync(new URL('./WorksGrid.jsx', import.meta.url), 'utf8');
  const durationClass = source.match(/<span className="([^"]*tabular-nums[^"]*)">/);

  assert.ok(durationClass, 'duration label should use tabular numerals');
  assert.match(durationClass[1], /text-white/);
  assert.doesNotMatch(durationClass[1], /bg-/);
  assert.match(durationClass[1], /drop-shadow-\[0_1px_0_rgba\(0,0,0,0\.8\)\]/);
});

test('the vertical fallback badge has no peach or orange outer ring', () => {
  const source = fs.readFileSync(new URL('./WorksGrid.jsx', import.meta.url), 'utf8');
  const badgeStyle = source.match(/color: '#EDB79C',[\s\S]*?writingMode: 'vertical-rl'/)?.[0] || '';

  assert.match(badgeStyle, /border: '1px solid #0C567D'/);
  assert.match(badgeStyle, /boxShadow: '0 12px 30px rgba\(12, 86, 125, 0\.34\)'/);
  assert.doesNotMatch(badgeStyle, /rgba\(237, 183, 156/);
});
