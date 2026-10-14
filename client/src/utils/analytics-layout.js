export function visitorListClassName() {
  return 'analytics-visitor-scroll space-y-2 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2';
}

export function allVisitorIds(visitors = []) {
  return visitors.map((visitor) => visitor.visitor_id).filter(Boolean);
}

export function toggleVisitorSelection(selectedIds, visitorId) {
  return selectedIds.includes(visitorId)
    ? selectedIds.filter((id) => id !== visitorId)
    : [...selectedIds, visitorId];
}

export function areAllVisitorsSelected(visitors = [], selectedIds = []) {
  const visitorIds = allVisitorIds(visitors);
  return visitorIds.length > 0 && visitorIds.every((id) => selectedIds.includes(id));
}

export function toggleAllVisitorSelection(visitors = [], selectedIds = []) {
  return areAllVisitorsSelected(visitors, selectedIds) ? [] : allVisitorIds(visitors);
}

export function visitorCardClassName(isActive) {
  const border = isActive ? 'border-blue-400 hover:border-blue-500' : 'border-slate-100 hover:border-blue-200';
  return `relative w-full cursor-pointer rounded-2xl border ${border} bg-white p-4 pr-20 text-left shadow-sm transition-colors`;
}
