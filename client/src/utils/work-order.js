export function moveSelectedWorksToBottom(works = [], selectedIds = []) {
  const selectedSet = new Set(selectedIds);
  const selected = [];
  const remaining = [];

  works.forEach((work) => {
    (selectedSet.has(work.id) ? selected : remaining).push(work);
  });

  return selected.length ? [...remaining, ...selected] : [...works];
}
