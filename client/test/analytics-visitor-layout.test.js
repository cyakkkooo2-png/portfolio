import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  allVisitorIds, toggleVisitorSelection, visitorListClassName,
} from '../src/utils/analytics-layout.js';

test('keeps the desktop visitor list visible with its own scroll area', () => {
  const classes = visitorListClassName();

  assert.match(classes, /lg:sticky/);
  assert.match(classes, /lg:top-\d+/);
  assert.match(classes, /lg:max-h-\[calc\(100vh-/);
  assert.match(classes, /lg:overflow-y-auto/);
  assert.match(classes, /lg:overscroll-contain/);
  assert.match(classes, /analytics-visitor-scroll/);
});

test('supports selecting visitors individually and selecting every visible visitor', () => {
  const visitors = [{ visitor_id: 'a' }, { visitor_id: 'b' }, { visitor_id: 'c' }];
  assert.deepEqual(allVisitorIds(visitors), ['a', 'b', 'c']);
  assert.deepEqual(toggleVisitorSelection(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(toggleVisitorSelection(['a', 'b'], 'a'), ['b']);
});

test('uses a slim light page scrollbar on the analytics dashboard', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /html:has\(\.analytics-dashboard\)::-webkit-scrollbar-track\s*{[^}]*background:\s*#f1f3f5/s);
  assert.match(css, /html:has\(\.analytics-dashboard\)::-webkit-scrollbar-thumb\s*{[^}]*background:\s*#c5cbd3/s);
});
