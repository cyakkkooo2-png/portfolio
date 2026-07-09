import { useEffect } from 'react';
const labels = { video: '🎬 视频', image: '🖼️ 图片', article: '📝 文章' };
function au(u) { if (!u) return ''; if (u.startsWith('/uploads/')) return 'https://portfolio-production-913f.up.railway.app' + u; return u; }

export default function WorkDetailModal({ work, onClose }) {
  const acc = '#ff6600';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [onClose]);
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
        <div style={{ background: '#080810' }}>
          {work.type === 'video'
            ? <video src={au(work.file_path)} controls className="w-full max-h-[55vh] object-contain" />
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
