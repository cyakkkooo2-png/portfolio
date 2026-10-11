import { FALLBACK_LINK_TEXT, safeFeishuFallbackUrl } from '../utils/work-description';

export default function WorkDescription({ work, className = '', style }) {
  const description = String(work?.description || '');
  if (!description) return null;

  const fallbackUrl = safeFeishuFallbackUrl(work);
  const markerIndex = fallbackUrl ? description.indexOf(FALLBACK_LINK_TEXT) : -1;
  if (markerIndex < 0) {
    return <p className={className} style={{ whiteSpace: 'pre-line', ...style }}>{description}</p>;
  }

  const before = description.slice(0, markerIndex);
  const after = description.slice(markerIndex + FALLBACK_LINK_TEXT.length);
  return (
    <p className={className} style={{ whiteSpace: 'pre-line', ...style }}>
      {before}
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noreferrer"
        className="mx-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold no-underline transition duration-200 hover:-translate-y-0.5 hover:brightness-125"
        style={{
          color: '#ff9a52',
          background: 'linear-gradient(135deg, rgba(255, 122, 26, 0.18), rgba(255, 122, 26, 0.08))',
          border: '1px solid rgba(255, 138, 55, 0.42)',
          boxShadow: '0 6px 18px rgba(255, 102, 0, 0.12)',
        }}
      >
        {FALLBACK_LINK_TEXT}
        <span aria-hidden="true" className="text-xs opacity-80">↗</span>
      </a>
      {after}
    </p>
  );
}
