import { useEffect, useMemo, useState } from 'react';
import { getWorks, reorderWorks } from '../api';
import { useAuth } from '../context/AuthContext';
import { RichText, txt, useTheme } from '../context/ThemeContext';

const FEATURED_LIMIT = 9;

const FILTERS = [
  { k: 'featured', l: '精选', icon: 'spark' },
  { k: 'all', l: '全部', icon: 'grid' },
  { k: 'video', l: '视频', icon: 'video' },
  { k: 'image', l: '图片', icon: 'image' },
  { k: 'article', l: '文章', icon: 'article' },
];

const LABELS = { video: '视频', image: '图片', article: '文章' };
const ICONS = { video: 'video', image: 'image', article: 'article' };

function assetUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return `/api/works/proxy-image?url=${encodeURIComponent(`https:${url}`)}`;
  if (/^https?:\/\//i.test(url)) return `/api/works/proxy-image?url=${encodeURIComponent(url)}`;
  return url;
}

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

  if (type === 'spark') {
    return (
      <svg {...common}>
        <path d="M12 3.8 13.7 9l5.5 1.1-5.1 2.5L12 18.2l-2.1-5.6-5.1-2.5L10.3 9 12 3.8Z" />
        <path d="M19 4.5v3" />
        <path d="M20.5 6h-3" />
      </svg>
    );
  }

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

function moveItem(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function workCardIdAtPoint(x, y) {
  const cards = Array.from(document.querySelectorAll('[data-work-card]'));
  let nearest = '';
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return card.getAttribute('data-work-card') || '';
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(centerX - x, centerY - y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = card.getAttribute('data-work-card') || '';
    }
  }

  return nearest;
}

export default function WorksGrid({ onSelectWork }) {
  const t = useTheme();
  const { user } = useAuth() || {};
  const [works, setWorks] = useState([]);
  const [filter, setFilter] = useState('featured');
  const [videoCategory, setVideoCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState('');
  const [dropId, setDropId] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);
  const [suppressClick, setSuppressClick] = useState(false);
  const acc = t?.accentColor || '#ff6600';
  const canArrange = Boolean(user);

  useEffect(() => {
    setLoading(true);
    getWorks().then((data) => setWorks(data.works || [])).finally(() => setLoading(false));
  }, []);

  const videoCategories = useMemo(() => [...new Set(
    works
      .filter((work) => work.type === 'video' && work.category)
      .map((work) => work.category)
  )], [works]);

  const visibleWorks = useMemo(() => {
    let list = works;
    if (filter === 'featured') list = list.slice(0, FEATURED_LIMIT);
    if (filter === 'video') list = list.filter((work) => work.type === 'video');
    if (filter === 'image') list = list.filter((work) => work.type === 'image');
    if (filter === 'article') list = list.filter((work) => work.type === 'article');
    if (filter === 'video' && videoCategory) list = list.filter((work) => work.category === videoCategory);
    return list;
  }, [filter, videoCategory, works]);

  async function saveOrder(nextWorks) {
    setSavingOrder(true);
    setWorks(nextWorks);
    try {
      const data = await reorderWorks(nextWorks.map((work) => work.id));
      setWorks(data.works || nextWorks);
    } catch (err) {
      alert(err.message || '保存排序失败');
      getWorks().then((data) => setWorks(data.works || []));
    } finally {
      setSavingOrder(false);
    }
  }

  function reorderVisible(sourceId, targetId) {
    const movingId = sourceId || dragId;
    if (!canArrange || !movingId || movingId === targetId || savingOrder) return;
    const visibleIds = visibleWorks.map((work) => work.id);
    const fromVisible = visibleIds.indexOf(movingId);
    const toVisible = visibleIds.indexOf(targetId);
    if (fromVisible < 0 || toVisible < 0) return;

    const reorderedVisibleIds = moveItem(visibleIds, fromVisible, toVisible);
    let cursor = 0;
    const nextWorks = works.map((work) => (
      visibleIds.includes(work.id)
        ? works.find((item) => item.id === reorderedVisibleIds[cursor++])
        : work
    ));
    saveOrder(nextWorks);
  }

  function startPointerDrag(event, id) {
    if (!canArrange || savingOrder) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    setDragId(id);
    setDropId(id);

    let moved = false;
    const handleMove = (moveEvent) => {
      if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 8) moved = true;
      const targetId = workCardIdAtPoint(moveEvent.clientX, moveEvent.clientY);
      if (targetId) setDropId(targetId);
    };
    const finish = (upEvent) => {
      const targetId = workCardIdAtPoint(upEvent.clientX, upEvent.clientY);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      setDragId('');
      setDropId('');
      if (moved && targetId && targetId !== id) {
        setSuppressClick(true);
        reorderVisible(id, targetId);
        window.setTimeout(() => setSuppressClick(false), 250);
      } else if (!moved) {
        onSelectWork?.(works.find((work) => work.id === id));
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }

  return (
    <section id="work" className="relative px-6 py-24 md:px-20" style={{ background: '#fff' }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-gray-900" style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", fontSize: 'clamp(42px, 4vw, 58px)', fontWeight: 900, lineHeight: 1.1 }}>
            <SplitTitle value={t?.worksTitle} fallback="精选作品" />
          </h2>
          <RichText as="p" value={t?.worksSubtitle} fallback="Selected works across video, image and writing" className="mt-4 text-base font-medium" style={{ color: '#a0a6b3' }} />
          {canArrange && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-600">
              <span>{savingOrder ? '正在保存排序…' : '已登录：按住任意作品卡片拖动即可排序，前 9 个会显示在精选'}</span>
            </div>
          )}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          {FILTERS.map((item) => {
            const active = filter === item.k;
            return (
              <button
                key={item.k}
                onClick={() => {
                  setFilter(item.k);
                  setVideoCategory('');
                }}
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

        {filter === 'video' && videoCategories.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#a0a6b3' }}>分组</span>
            <button
              onClick={() => setVideoCategory('')}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
              style={!videoCategory ? { background: '#1d2333', color: '#fff' } : { background: '#f1f3f7', color: '#6e7685' }}
            >
              全部视频
            </button>
            {videoCategories.map((category) => (
              <button
                key={category}
                onClick={() => setVideoCategory(category)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                style={videoCategory === category ? { background: acc, color: '#fff' } : { background: '#f1f3f7', color: '#6e7685' }}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="mt-14">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="aspect-video rounded-2xl" style={{ background: '#101322' }} />)}
            </div>
          ) : visibleWorks.length === 0 ? (
            <div className="rounded-2xl py-20 text-center" style={{ background: '#f7f8fb', color: '#a0a6b3' }}>
              <RichText value={t?.worksEmpty} fallback="还没有作品" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {visibleWorks.map((work) => (
                <article
                  key={work.id}
                  data-work-card={work.id}
                  className={`group relative aspect-video touch-none select-none overflow-hidden rounded-2xl transition-transform hover:-translate-y-1 ${canArrange ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${dropId === work.id ? 'ring-4 ring-orange-300' : ''} ${dragId === work.id ? 'opacity-60' : ''}`}
                  style={{ background: '#0f1322', boxShadow: '0 28px 55px rgba(15,19,34,0.14)' }}
                  onPointerDown={(event) => {
                    if (canArrange) startPointerDrag(event, work.id);
                  }}
                  onClick={() => {
                    if (dragId || suppressClick) return;
                    onSelectWork?.(work);
                  }}
                >
                  {work.type === 'image' && work.file_path ? <img src={assetUrl(work.file_path)} alt={work.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : work.thumbnail ? <img src={assetUrl(work.thumbnail)} alt={work.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : null}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(9,12,24,0.08) 0%, rgba(6,8,18,0.92) 100%)' }} />
                  {canArrange && (
                    <div
                      className="absolute left-4 top-4 z-10 flex touch-none cursor-grab select-none items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-700 shadow-lg backdrop-blur"
                      title="按住拖动排序"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className="grid h-4 w-4 grid-cols-2 gap-0.5">
                        {Array.from({ length: 4 }).map((_, index) => <i key={index} className="rounded-sm bg-orange-500" />)}
                      </span>
                      可拖动
                    </div>
                  )}
                  <div className="absolute bottom-7 left-7 right-7">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.14)' }}>
                      <FilterIcon type={ICONS[work.type] || 'article'} active color="#fff" />
                      {work.type === 'video' && work.category ? work.category : (LABELS[work.type] || work.type)}
                    </span>
                    <h3
                      className="mt-4 overflow-hidden text-xl font-bold leading-tight text-white"
                      style={{
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        textShadow: '0 2px 14px rgba(0,0,0,0.45)',
                      }}
                    >
                      {work.title}
                    </h3>
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
