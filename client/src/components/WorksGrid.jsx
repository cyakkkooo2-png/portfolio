import { useState, useEffect } from 'react';
import { getWorks } from '../api';
import { useTheme, txt } from '../context/ThemeContext';

function au(u) { if (!u) return null; if (u.startsWith('/uploads/')) return 'https://portfolio-production-913f.up.railway.app' + u; return u; }

const FILTERS = [
  { k: '', l: '全部', icon: '✦' },
  { k: 'video', l: '视频', icon: '🎬' },
  { k: 'image', l: '图片', icon: '🖼️' },
  { k: 'article', l: '文章', icon: '📝' },
];
const LABELS = { video: '🎬 视频', image: '🖼️ 图片', article: '📝 文章' };
const ICONS = { video: '🎬', image: '🖼️', article: '📝' };

export default function WorksGrid({ onSelectWork }) {
  const t = useTheme();
  const [works, setWorks] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const acc = t?.accentColor || '#ff6600';

  useEffect(() => {
    setLoading(true);
    getWorks(filter || undefined)
      .then(d => setWorks(d.works))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <section id="work" className="relative py-36 px-8 md:px-20" style={{ background: '#08080c' }}>
      <div className="max-w-7xl mx-auto">
        {/* 01 Works */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs font-semibold tracking-[0.25em]" style={{ color: acc }}>01</span>
          <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-[11px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Works</span>
        </div>

        {/* 精选作品 */}
        <h2 className="font-black leading-none mb-14 text-white"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 64px)' }}>
          {txt(t?.worksTitle, '精选作品')}
        </h2>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-16 flex-wrap">
          {FILTERS.map(x => {
            const active = filter === x.k;
            return (
              <button key={x.k} onClick={() => setFilter(x.k)}
                className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
                style={active
                  ? { background: acc, color: '#fff', boxShadow: `0 4px 20px ${acc}40`, transform: 'scale(1.03)' }
                  : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span className="mr-1.5">{x.icon}</span>{x.l}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3', background: '#0f0f17' }}>
                <div className="w-full h-full relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, #0f0f17 0%, #1a1a25 50%, #0f0f17 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.8s ease-in-out infinite',
                  }} />
              </div>
            ))}
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-base font-medium text-white">{txt(t?.worksEmpty, '还没有作品')}</p>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>精彩内容即将上线</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {works.map((x, idx) => (
              <article key={x.id}
                className="card-glow group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02]"
                style={{ aspectRatio: '4/3', background: '#111', animation: `floatUp 0.5s ease ${idx * 0.08}s both` }}
                onClick={() => onSelectWork?.(x)}>
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                  {x.type === 'image' && x.file_path ? (
                    <img src={au(x.file_path)} alt={x.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : x.thumbnail ? (
                    <img src={au(x.thumbnail)} alt={x.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle at center, #1a1a2e 0%, #0d0d15 100%)' }}>
                      <span className="text-6xl opacity-10 group-hover:opacity-15 transition-opacity duration-500">{ICONS[x.type] || '📄'}</span>
                    </div>
                  )}
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.85) 100%)' }} />
                {/* Hover tint */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `${acc}08` }} />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium mb-3 backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}>
                    {LABELS[x.type]}
                  </span>
                  <h3 className="text-base font-bold text-white">{x.title}</h3>
                  {x.description && <p className="text-xs mt-1.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{x.description}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
