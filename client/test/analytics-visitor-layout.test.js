import test from 'node:test';
import assert from 'node:assert/strict';
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
});

test('supports selecting visitors individually and selecting every visible visitor', () => {
  const visitors = [{ visitor_id: 'a' }, { visitor_id: 'b' }, { visitor_id: 'c' }];
  assert.deepEqual(allVisitorIds(visitors), ['a', 'b', 'c']);
  assert.deepEqual(toggleVisitorSelection(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(toggleVisitorSelection(['a', 'b'], 'a'), ['b']);
});
