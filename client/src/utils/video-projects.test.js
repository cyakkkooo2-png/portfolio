import test from 'node:test';
import assert from 'node:assert/strict';
import { groupVideoProjects } from './video-projects.js';

test('groups videos by project while preserving the first project and work order', () => {
  const groups = groupVideoProjects([
    { id: 'a', project: '手机发布会' },
    { id: 'b', project: '' },
    { id: 'c', project: '手机发布会' },
    { id: 'd', project: '品牌短片' },
  ]);

  assert.deepEqual(groups.map((group) => group.name), ['手机发布会', '未分组', '品牌短片']);
  assert.deepEqual(groups[0].works.map((work) => work.id), ['a', 'c']);
  assert.deepEqual(groups[1].works.map((work) => work.id), ['b']);
});

test('normalizes project whitespace before grouping', () => {
  const groups = groupVideoProjects([
    { id: 'a', project: '  同一项目  ' },
    { id: 'b', project: '同一项目' },
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, '同一项目');
});
