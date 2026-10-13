export function normalizeVisitorNote(value) {
  return String(value || '').trim().slice(0, 30);
}
