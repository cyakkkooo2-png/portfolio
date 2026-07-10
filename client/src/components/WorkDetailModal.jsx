import { useEffect, useState } from 'react';
const labels = { video: '🎬 视频', image: '🖼️ 图片', article: '📝 文章' };
function au(u) { if (!u) return ''; if (u.startsWith('/uploads/')) return 'https://portfolio-production-913f.up.railway.app' + u; return u; }
function videoSrc(u) { if (!u) return ''; if (u.startsWith('/uploads/')) return 'https://portfolio-production-913f.up.railway.app' + u; if (/^https?:\/\//i.test(u)) return `/api/works/proxy-video?url=${encodeURIComponent(u)}`; return u; }
function openCurrentTab(url) { if (url) window.location.href = url; }

export default function WorkDetailModal({ work, onClose }) {
  const acc = '#ff6600';
  const [videoRatio, setVideoRatio] = useState(16 / 9);
  const [showInlinePlayer, setShowInlinePlayer] = useState(false);
  const isExternalVideo = work?.type === 'video' && /^https?:\/\//i.test(work?.file_path || '');
  const originalUrl = work?.external_url || work?.source_url || work?.file_path;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  useEffect(() => {
    setVideoRatio(16 / 9);
    setShowInlinePlayer(false);
  }, [work?.id]);

  if (!work) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}
      onClick={onClose}>
      <div className="relative rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
        style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Media */}
        <div
          className="w-full overflow-hidden"
          style={{
            background: '#080810',
            aspectRatio: work.type === 'video' ? videoRatio : '16 / 9',
            maxHeight: '62vh',
          }}
        >
          {work.type === 'video'
            ? isExternalVideo && !showInlinePlayer
              ? (
                <div className="relative h-full w-full">
                  {work.thumbnail ? (
                    <img src={au(work.thumbnail)} alt={work.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, #141420, #080810)' }} />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.72))' }}>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white" style={{ background: acc, boxShadow: `0 18px 45px ${acc}50` }}>▶</div>
                    <div>
                      <p className="text-sm font-semibold text-white">这是外部网页视频</p>
                      <p className="mt-1 text-xs text-white/55">站内播放器可能被对方网站限制，建议打开原网页播放。</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button type="button" onClick={() => openCurrentTab(originalUrl)} className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: acc }}>
                        打开原网页播放
                      </button>
                      <button type="button" onClick={() => setShowInlinePlayer(true)} className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white">
                        尝试站内播放
                      </button>
                    </div>
                  </div>
                </div>
              )
              : <video
                  src={videoSrc(work.file_path)}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                  onLoadedMetadata={(event) => {
                    const video = event.currentTarget;
                    if (video.videoWidth && video.videoHeight) {
                      setVideoRatio(video.videoWidth / video.videoHeight);
                    }
                  }}
                />
            : work.type === 'image'
              ? <img src={au(work.file_path)} alt={work.title} className="w-full max-h-[55vh] object-contain" />
              : work.thumbnail
                ? <img src={au(work.thumbnail)} alt={work.title} className="w-full max-h-[35vh] object-cover" />
                : <div className="w-full h-48 flex items-center justify-center text-6xl opacity-20"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>📝</div>}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: `${acc}15`, color: acc, border: `1px solid ${acc}25` }}>
            {labels[work.type]}
          </span>
          <h2 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
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
              打开原网页播放
            </button>
          )}

          {work.type === 'article' && work.content && (
            <div className="mt-4 pt-5 leading-relaxed space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
              {work.content.split('\n\n').map((b, i) => <p key={i}>{b}</p>)}
            </div>
          )}

          {work.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {work.tags.map(t => (
                <span key={t} className="px-3 py-1 rounded-full text-xs transition-all duration-300 hover:bg-white/8"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs mt-5" style={{ color: 'rgba(255,255,255,0.18)' }}>
            {new Date(work.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
