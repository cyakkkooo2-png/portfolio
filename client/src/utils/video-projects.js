export const UNGROUPED_PROJECT = '未分组';

export function normalizeVideoProject(value) {
  return String(value || '').trim();
}

export function groupVideoProjects(works = []) {
  const groups = new Map();
  works.forEach((work) => {
    const project = normalizeVideoProject(work.project);
    const name = project || UNGROUPED_PROJECT;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(work);
  });
  return Array.from(groups, ([name, projectWorks]) => ({ name, works: projectWorks }));
}
