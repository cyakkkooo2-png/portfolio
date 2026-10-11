import {
  ARTICLE_FALLBACK_LINK_TEXT,
  FALLBACK_LINK_TEXT,
  safeArticleOriginalUrl,
  safeFeishuFallbackUrl,
} from '../utils/work-description';

function CompactFallbackBadge({ href, children, className = '', style }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold leading-5 no-underline transition duration-200 hover:-translate-y-px hover:brightness-125 ${className}`}
      style={{
        color: '#ff9a52',
        background: 'linear-gradient(135deg, rgba(255, 122, 26, 0.16), rgba(255, 122, 26, 0.07))',
        border: '1px solid rgba(255, 138, 55, 0.38)',
        boxShadow: '0 4px 12px rgba(255, 102, 0, 0.1)',
        ...style,
      }}
    >
      {children}
    </a>
  );
}

export function FallbackLinkBadge({ work, className = '', style }) {
  const fallbackUrl = safeFeishuFallbackUrl(work);
  return (
    <CompactFallbackBadge href={fallbackUrl} className={className} style={style}>
      {FALLBACK_LINK_TEXT}
    </CompactFallbackBadge>
  );
}

export function ArticleFallbackLinkBadge({ work, className = '', style }) {
  const originalUrl = safeArticleOriginalUrl(work);
  return (
    <CompactFallbackBadge href={originalUrl} className={className} style={style}>
      {ARTICLE_FALLBACK_LINK_TEXT}
    </CompactFallbackBadge>
  );
}

export default function WorkDescription({ work, className = '', style, showFallbackLink = true }) {
  const description = String(work?.description || '');
  if (!description) return null;

  const fallbackUrl = safeFeishuFallbackUrl(work);
  const markerIndex = fallbackUrl ? description.indexOf(FALLBACK_LINK_TEXT) : -1;
  if (markerIndex < 0) {
    return <p className={className} style={{ whiteSpace: 'pre-line', ...style }}>{description}</p>;
  }

  const before = description.slice(0, markerIndex);
  const after = description.slice(markerIndex + FALLBACK_LINK_TEXT.length);
  if (!showFallbackLink) {
    const remainingDescription = `${before}${after}`.trim();
    if (!remainingDescription) return null;
    return <p className={className} style={{ whiteSpace: 'pre-line', ...style }}>{remainingDescription}</p>;
  }

  return (
    <p className={className} style={{ whiteSpace: 'pre-line', ...style }}>
      {before}
      <FallbackLinkBadge work={work} className="mx-1" />
      {after}
    </p>
  );
}
