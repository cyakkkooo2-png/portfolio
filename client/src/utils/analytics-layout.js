export function visitorListClassName() {
  return 'space-y-2 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2';
}

export function allVisitorIds(visitors = []) {
  return visitors.map((visitor) => visitor.visitor_id).filter(Boolean);
}

export function toggleVisitorSelection(selectedIds, visitorId) {
  return selectedIds.includes(visitorId)
    ? selectedIds.filter((id) => id !== visitorId)
    : [...selectedIds, visitorId];
}
