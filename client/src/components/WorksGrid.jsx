import { useEffect, useState } from 'react';
import { getWorks } from '../api';
import { RichText, txt, useTheme } from '../context/ThemeContext';

const FILTERS = [
  { k: '', l: '全部', icon: 'grid' },
  { k: 'video', l: '视频', icon: 'video' },
  { k: 'image', l: '图片', icon: 'image' },
  { k: 'article', l: '文章', icon: 'article' },
];

const LABELS = { video: '视频', image: '图片', article: '文章' };
const ICONS = { video: 'video', image: 'image', article: 'article' };

function FilterIcon({ type, active, color }) {
  const stroke = active ? '#fff' : color;
  const common = {
    className: 'h-4 w-4',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (type === 'grid') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
      </svg>
    );
  }

  if (type === 'video') {
    return (
      <svg {...common}>
        <path d="M5 7.5h11.5a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2Z" />
        <path d="m8 7.5 2-3" />
        <path d="m14 7.5 2-3" />
        <path d="m10 11.2 4 2.3-4 2.3v-4.6Z" fill={active ? '#fff' : color} stroke="none" />
      </svg>
    );
  }

  if (type === 'image') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="14" rx="2.4" />
        <path d="m4 15 4.2-4.2a1.6 1.6 0 0 1 2.2 0l3.7 3.7" />
        <path d="m13.5 14 1.5-1.5a1.6 1.6 0 0 1 2.2 0L20 15.3" />
        <circle cx="15.5" cy="9.5" r="1.2" fill={active ? '#fff' : color} stroke="none" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M7.5 3.8h6.8L18 7.5v12.2a1.8 1.8 0 0 1-1.8 1.8H7.5a1.8 1.8 0 0 1-1.8-1.8V5.6a1.8 1.8 0 0 1 1.8-1.8Z" />
      <path d="M14 3.8V8h4" />
      <path d="M9 12.2h6" />
      <path d="M9 15.6h5" />
    </svg>
  );
}

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
    getWorks(filter || undefined).then((data) => setWorks(data.works || [])).finally(() => setLoading(false));
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
          {FILTERS.map((item) => {
            const active = filter === item.k;
            return (
              <button
                key={item.k}
                onClick={() => setFilter(item.k)}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all"
                style={active ? { background: acc, color: '#fff', boxShadow: `0 12px 24px ${acc}30` } : { background: '#f7f8fb', color: '#8f96a3' }}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full" style={active ? { background: 'rgba(255,255,255,0.18)' } : { background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(17,24,39,0.05)' }}>
                  <FilterIcon type={item.icon} active={active} color={acc} />
                </span>
                {item.l}
              </button>
            );
          })}
        </div>

        <div className="mt-14">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="aspect-video rounded-2xl" style={{ background: '#101322' }} />)}
            </div>
          ) : works.length === 0 ? (
            <div className="rounded-2xl py-20 text-center" style={{ background: '#f7f8fb', color: '#a0a6b3' }}>
              <RichText value={t?.worksEmpty} fallback="还没有作品" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {works.map((work) => (
                <article key={work.id} className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl transition-transform hover:-translate-y-1" style={{ background: '#0f1322', boxShadow: '0 28px 55px rgba(15,19,34,0.14)' }} onClick={() => onSelectWork?.(work)}>
                  {work.type === 'image' && work.file_path ? <img src={work.file_path} alt={work.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : work.thumbnail ? <img src={work.thumbnail} alt={work.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : null}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(9,12,24,0.08) 0%, rgba(6,8,18,0.92) 100%)' }} />
                  <div className="absolute bottom-7 left-7 right-7">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.14)' }}>
                      <FilterIcon type={ICONS[work.type] || 'article'} active color="#fff" />
                      {LABELS[work.type] || work.type}
                    </span>
                    <h3 className="mt-4 text-xl font-bold text-white">{work.title}</h3>
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
