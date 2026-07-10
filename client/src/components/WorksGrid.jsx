import { useEffect, useState } from 'react';
import { getWorks } from '../api';
import { RichText, txt, useTheme } from '../context/ThemeContext';

const FILTERS = [
  { k: '', l: '全部' },
  { k: 'video', l: '🎬 视频' },
  { k: 'image', l: '🖼️ 图片' },
  { k: 'article', l: '📄 文章' },
];

const LABELS = { video: '🎬 视频', image: '🖼️ 图片', article: '📄 文章' };

function SplitTitle({ value, fallback }) {
  const text = txt(value, fallback);
  if (value?.chars?.some(Boolean)) return <RichText value={value} fallback={fallback} />;
  if (text.length <= 2) return text;
  return <>{text.slice(0, -2)}<span style={{ color: '#ff6600' }}>{text.slice(-2)}</span></>;
}

export default function WorksGrid({ onSelectWork }) {
  const t = useTheme();
  const [works, setWorks] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const acc = t?.accentColor || '#ff6600';

  useEffect(() => {
    setLoading(true);
    getWorks(filter || undefined).then((d) => setWorks(d.works || [])).finally(() => setLoading(false));
  }, [filter]);

  return (
    <section id="work" className="relative px-6 py-24 md:px-20" style={{ background: '#fff' }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-gray-900" style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", fontSize: 'clamp(42px, 4vw, 58px)', fontWeight: 900, lineHeight: 1.1 }}>
            <SplitTitle value={t?.worksTitle} fallback="精选作品" />
          </h2>
          <RichText as="p" value={t?.worksSubtitle} fallback="Selected works across video, image and writing" className="mt-4 text-base font-medium" style={{ color: '#a0a6b3' }} />
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          {FILTERS.map((x) => {
            const active = filter === x.k;
            return (
              <button key={x.k} onClick={() => setFilter(x.k)} className="rounded-full px-5 py-2 text-sm font-semibold transition-all" style={active ? { background: acc, color: '#fff', boxShadow: `0 12px 24px ${acc}30` } : { background: '#f7f8fb', color: '#9aa0ad' }}>
                {x.l}
              </button>
            );
          })}
        </div>

        <div className="mt-14">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-video rounded-2xl" style={{ background: '#101322' }} />)}
            </div>
          ) : works.length === 0 ? (
            <div className="rounded-2xl py-20 text-center" style={{ background: '#f7f8fb', color: '#a0a6b3' }}>
              <RichText value={t?.worksEmpty} fallback="还没有作品" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {works.map((x) => (
                <article key={x.id} className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl transition-transform hover:-translate-y-1" style={{ background: '#0f1322', boxShadow: '0 28px 55px rgba(15,19,34,0.14)' }} onClick={() => onSelectWork?.(x)}>
                  {x.type === 'image' && x.file_path ? <img src={x.file_path} alt={x.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : x.thumbnail ? <img src={x.thumbnail} alt={x.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : null}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(9,12,24,0.08) 0%, rgba(6,8,18,0.92) 100%)' }} />
                  <div className="absolute bottom-7 left-7 right-7">
                    <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.14)' }}>{LABELS[x.type] || x.type}</span>
                    <h3 className="mt-4 text-xl font-bold text-white">{x.title}</h3>
                  </div>
                  <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-xl text-white opacity-0 transition-opacity group-hover:opacity-100" style={{ background: acc }}>→</div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
