import { useEffect, useState } from 'react';

const labels = { video: '视频', image: '图片', article: '文章' };

function assetUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return `/api/works/proxy-image?url=${encodeURIComponent(`https:${url}`)}`;
  if (url.startsWith('/uploads/')) return `https://portfolio-production-913f.up.railway.app${url}`;
  if (/^https?:\/\//i.test(url)) return `/api/works/proxy-image?url=${encodeURIComponent(url)}`;
  return url;
}

function videoUrl(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `https://portfolio-production-913f.up.railway.app${url}`;
  if (/^https?:\/\//i.test(url)) return `/api/works/proxy-video?url=${encodeURIComponent(url)}`;
  return url;
}

function openCurrentTab(url) {
  if (url) window.location.href = url;
}

function TypeIcon({ type }) {
  const common = { className: 'h-3.5 w-3.5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'video') return <svg {...common}><path d="M5 7.5h11.5a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2Z" /><path d="m10 11.2 4 2.3-4 2.3v-4.6Z" /></svg>;
  if (type === 'image') return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2.4" /><path d="m4 15 4.2-4.2a1.6 1.6 0 0 1 2.2 0l3.7 3.7" /><circle cx="15.5" cy="9.5" r="1.2" /></svg>;
  return <svg {...common}><path d="M7.5 3.8h6.8L18 7.5v12.2a1.8 1.8 0 0 1-1.8 1.8H7.5a1.8 1.8 0 0 1-1.8-1.8V5.6a1.8 1.8 0 0 1 1.8-1.8Z" /><path d="M14 3.8V8h4" /><path d="M9 12.2h6" /><path d="M9 15.6h5" /></svg>;
}

export default function WorkDetailModal({ work, onClose }) {
  const acc = '#ff6600';
  const [videoRatio, setVideoRatio] = useState(16 / 9);
  const [videoError, setVideoError] = useState(false);
  const isExternalVideo = work?.type === 'video' && /^https?:\/\//i.test(work?.file_path || '');
  const originalUrl = work?.external_url || work?.source_url || work?.file_path;
  const isLinkOnlyVideo = work?.type === 'video' && !work?.file_path && !!originalUrl;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setVideoRatio(16 / 9);
    setVideoError(false);
  }, [work?.id]);

  if (!work) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
        style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 hover:rotate-90"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div
          className="w-full overflow-hidden"
          style={{
            background: '#080810',
            aspectRatio: work.type === 'video' ? videoRatio : '16 / 9',
            maxHeight: '62vh',
          }}
        >
          {work.type === 'video' && isLinkOnlyVideo ? (
            <div className="relative h-full w-full">
              {work.thumbnail ? (
                <img src={assetUrl(work.thumbnail)} alt={work.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, #141420, #080810)' }} />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.74))' }}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: acc, boxShadow: `0 18px 45px ${acc}50` }}>
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10-6.5-10-6.5Z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">B站视频</p>
                  <p className="mt-1 text-xs text-white/60">该视频需要跳转到 B站 原网页播放。</p>
                </div>
                <button type="button" onClick={() => openCurrentTab(originalUrl)} className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: acc }}>
                  打开 B站播放
                </button>
              </div>
            </div>
          ) : work.type === 'video' ? (
            <div className="relative h-full w-full">
              <video
                src={videoUrl(work.file_path)}
                controls
                preload="metadata"
                className="h-full w-full object-contain"
                onLoadedMetadata={(event) => {
                  const video = event.currentTarget;
                  if (video.videoWidth && video.videoHeight) {
                    setVideoRatio(video.videoWidth / video.videoHeight);
                  }
                }}
                onCanPlay={() => setVideoError(false)}
                onError={() => setVideoError(true)}
              />
              {isExternalVideo && videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.82))' }}>
                  {work.thumbnail && <img src={assetUrl(work.thumbnail)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: acc, boxShadow: `0 18px 45px ${acc}50` }}>
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10-6.5-10-6.5Z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">站内播放受限</p>
                    <p className="mt-1 text-xs text-white/60">这个外部视频被原网站限制了播放方式，请打开原网页观看。</p>
                  </div>
                  <button type="button" onClick={() => openCurrentTab(originalUrl)} className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: acc }}>
                    打开原网页播放
                  </button>
                </div>
              )}
            </div>
          ) : work.type === 'image' ? (
            <img src={assetUrl(work.file_path)} alt={work.title} className="max-h-[55vh] w-full object-contain" />
          ) : work.thumbnail ? (
            <img src={assetUrl(work.thumbnail)} alt={work.title} className="max-h-[35vh] w-full object-cover" />
          ) : (
            <div className="flex h-48 w-full items-center justify-center text-6xl opacity-20" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>📄</div>
          )}
        </div>

        <div className="overflow-y-auto p-6 md:p-8">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ background: `${acc}15`, color: acc, border: `1px solid ${acc}25` }}>
            <TypeIcon type={work.type} />
            {labels[work.type]}
          </span>
          <h2 className="mb-3 text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            {work.title}
          </h2>
          {work.description && <p className="mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>{work.description}</p>}

          {(work.external_url || work.source_url) && !isExternalVideo && (
            <button
              type="button"
              onClick={() => openCurrentTab(work.external_url || work.source_url)}
              className="mb-5 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white no-underline transition hover:opacity-90"
              style={{ background: acc }}
            >
              打开原网页
            </button>
          )}

          {work.type === 'article' && work.content && (
            <div className="mt-4 space-y-3 pt-5 leading-relaxed" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
              {work.content.split('\n\n').map((block, index) => <p key={index}>{block}</p>)}
            </div>
          )}

          {work.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {work.tags.map((tag) => (
                <span key={tag} className="rounded-full px-3 py-1 text-xs transition-all duration-300 hover:bg-white/8" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <p className="mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
            {new Date(work.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
