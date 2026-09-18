export function imageAspectRatio(work = {}, measuredRatios = {}) {
  const ratio = Number(work.image_aspect_ratio || measuredRatios[work.id]);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

export function splitImageWorksByOrientation(works = [], measuredRatios = {}) {
  return works.reduce((groups, work) => {
    const ratio = imageAspectRatio(work, measuredRatios);
    if (!ratio) groups.unknown.push(work);
    else if (ratio < 1) groups.portrait.push(work);
    else groups.landscape.push(work);
    return groups;
  }, { landscape: [], portrait: [], unknown: [] });
}
