import { useEffect, useMemo, useState } from 'react';
import { getWorks, reorderWorks, toggleWorkFeatured, toggleWorkVisibility, updateWorkCategory, uploadWorkWithProgress } from '../api';
import { useAuth } from '../context/AuthContext';
import { RichText, txt, useTheme } from '../context/ThemeContext';
import { VIDEO_CATEGORIES } from '../utils/video-categories';
import { imageAspectRatio, splitImageWorksByOrientation } from '../utils/image-layout';
import { externalVideoPreviewSrc } from '../utils/external-video-preview';

const DISPLAY_TITLE_FONT = "'CCY Title Serif', 'Noto Serif SC', serif";
const WORK_CARD_TITLE_FONT = "'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei UI', 'Microsoft YaHei', sans-serif";

const FILTERS = [
  { k: 'featured', l: '精选', icon: 'spark' },
  { k: 'all', l: '全部', icon: 'grid' },
  { k: 'video', l: '视频', icon: 'video' },
  { k: 'image', l: '图片', icon: 'image' },
  { k: 'article', l: '文章', icon: 'article' },
];

function isTencentVodUrl(url = '') {
  return /^https?:\/\/[^/]+\.(?:vod2\.myqcloud\.com|vod-qcloud\.com|vod\.tencent-cloud\.com)(?:\/|$)/i.test(url);
}

function assetUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return `/api/works/proxy-image?url=${encodeURIComponent(`https:${url}`)}`;
  if (isTencentVodUrl(url)) return url;
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
  if (value?.chars?.some(Boolean)) {
    const chars = Array.from(text);
    const charStyles = Array.isArray(value.chars) ? value.chars : [];
    return (
      <>
        {chars.map((char, index) => {
          const fallbackAccent = index >= Math.max(0, chars.length - 2) ? '#ff6600' : undefined;
          const color = charStyles[index]?.color || fallbackAccent;
          return (
            <span
              key={`${char}-${index}`}
              style={{
                ...(color ? { color } : {}),
                fontFamily: DISPLAY_TITLE_FONT,
                fontStyle: 'normal',
                textDecoration: 'none',
              }}
            >
              {char}
            </span>
          );
        })}
      </>
    );
  }
  if (text.length <= 2) return text;
  return <>{text.slice(0, -2)}<span style={{ color: '#ff6600' }}>{text.slice(-2)}</span></>;
}

function moveItem(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function WorksGrid({ onSelectWork }) {
  const t = useTheme();
  const { user } = useAuth() || {};
  const [works, setWorks] = useState([]);
  const [filter, setFilter] = useState('featured');
  const [videoCategory, setVideoCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [selectedMoveId, setSelectedMoveId] = useState('');
  const [arrangeMode, setArrangeMode] = useState(false);
  const [selectedWorkIds, setSelectedWorkIds] = useState([]);
  const [batchSaving, setBatchSaving] = useState(false);
  const [featuredBusyId, setFeaturedBusyId] = useState('');
  const [categoryBusyId, setCategoryBusyId] = useState('');
  const [coverBusyId, setCoverBusyId] = useState('');
  const [measuredImageRatios, setMeasuredImageRatios] = useState({});
  const acc = t?.accentColor || '#ff6600';
  const isLoggedIn = Boolean(user);
  const canArrange = isLoggedIn && arrangeMode;
  const selectedWorkSet = useMemo(() => new Set(selectedWorkIds), [selectedWorkIds]);

  useEffect(() => {
    setLoading(true);
    getWorks().then((data) => setWorks(data.works || [])).finally(() => setLoading(false));
  }, []);

  const visibleWorks = useMemo(() => {
    let list = works;
    if (filter === 'featured') list = list.filter((work) => work.featured);
    if (filter === 'video') list = list.filter((work) => work.type === 'video');
    if (filter === 'image') list = list.filter((work) => work.type === 'image');
    if (filter === 'article') list = list.filter((work) => work.type === 'article');
    if (filter === 'video' && videoCategory) list = list.filter((work) => work.category === videoCategory);
    return list;
  }, [filter, videoCategory, works]);

  useEffect(() => {
    if (filter !== 'image') return undefined;
    const pending = visibleWorks.filter((work) => (
      work.type === 'image'
      && work.file_path
      && !imageAspectRatio(work, measuredImageRatios)
    ));
    const cleanups = pending.map((work) => {
      const image = new Image();
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight) return;
        setMeasuredImageRatios((current) => ({
          ...current,
          [work.id]: Number((image.naturalWidth / image.naturalHeight).toFixed(6)),
        }));
      };
      image.src = assetUrl(work.file_path);
      return () => { image.onload = null; };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [filter, measuredImageRatios, visibleWorks]);

  const displayWorks = useMemo(() => {
    if (filter !== 'image') return visibleWorks;
    const groups = splitImageWorksByOrientation(visibleWorks, measuredImageRatios);
    const items = [];
    if (groups.landscape.length || groups.unknown.length) {
      items.push({ __section: 'landscape', id: '__landscape' }, ...groups.landscape, ...groups.unknown);
    }
    if (groups.portrait.length) {
      items.push({ __section: 'portrait', id: '__portrait' }, ...groups.portrait);
    }
    return items;
  }, [filter, measuredImageRatios, visibleWorks]);

  const visibleWorkIds = useMemo(() => visibleWorks.map((work) => work.id), [visibleWorks]);
  const selectedVisibleCount = useMemo(
    () => visibleWorkIds.filter((id) => selectedWorkSet.has(id)).length,
    [selectedWorkSet, visibleWorkIds]
  );

  async function saveOrder(nextWorks) {
    const safeWorks = nextWorks.filter((work) => work && work.id);
    setSavingOrder(true);
    setWorks(safeWorks);
    try {
      const data = await reorderWorks(safeWorks.map((work) => work.id));
      setWorks(data.works || safeWorks);
    } catch (err) {
      alert(err.message || '保存排序失败');
      getWorks().then((data) => setWorks(data.works || []));
    } finally {
      setSavingOrder(false);
    }
  }

  function reorderVisible(sourceId, targetId) {
    const movingId = sourceId;
    if (!canArrange || !movingId || movingId === targetId || savingOrder) return;
    const visibleIds = visibleWorks.map((work) => work.id);
    const fromVisible = visibleIds.indexOf(movingId);
    const toVisible = visibleIds.indexOf(targetId);
    if (fromVisible < 0 || toVisible < 0) return;

    const reorderedVisibleIds = moveItem(visibleIds, fromVisible, toVisible);
    const visibleSet = new Set(visibleIds);
    const workById = new Map(works.map((work) => [work.id, work]));
    let cursor = 0;
    const nextWorks = works.map((work) => {
      if (!visibleSet.has(work.id)) return work;
      return workById.get(reorderedVisibleIds[cursor++]) || work;
    });
    saveOrder(nextWorks);
  }

  function handleWorkClick(work) {
    if (!canArrange) {
      onSelectWork?.(work);
      return;
    }

    if (savingOrder) return;

    if (!selectedMoveId) {
      setSelectedMoveId(work.id);
      return;
    }

    if (selectedMoveId === work.id) {
      setSelectedMoveId('');
      return;
    }

    const sourceId = selectedMoveId;
    setSelectedMoveId('');
    reorderVisible(sourceId, work.id);
  }

  async function handleToggleVisibility(event, work) {
    event.stopPropagation();
    const nextHidden = !work.hidden;
    const previousWorks = works;
    setWorks((current) => current.map((item) => (
      item.id === work.id ? { ...item, hidden: nextHidden } : item
    )));

    try {
      const data = await toggleWorkVisibility(work.id, nextHidden);
      if (data.work) {
        setWorks((current) => current.map((item) => (
          item.id === work.id ? { ...item, ...data.work } : item
        )));
      }
    } catch (err) {
      setWorks(previousWorks);
      alert(err.message || '修改显示状态失败');
    }
  }

  async function handleToggleFeatured(event, work) {
    event.stopPropagation();
    if (featuredBusyId) return;
    const nextFeatured = !work.featured;
    const previousWorks = works;
    setFeaturedBusyId(work.id);
    setWorks((current) => current.map((item) => (
      item.id === work.id ? { ...item, featured: nextFeatured } : item
    )));

    try {
      const data = await toggleWorkFeatured(work.id, nextFeatured);
      if (data.work) {
        setWorks((current) => current.map((item) => (
          item.id === work.id ? { ...item, ...data.work } : item
        )));
      }
    } catch (err) {
      setWorks(previousWorks);
      alert(err.message || '修改精选状态失败');
    } finally {
      setFeaturedBusyId('');
    }
  }

  async function handleCategoryChange(event, work) {
    event.stopPropagation();
    if (categoryBusyId) return;
    const category = event.target.value;
    const previousWorks = works;
    setCategoryBusyId(work.id);
    setWorks((current) => current.map((item) => (
      item.id === work.id ? { ...item, category } : item
    )));

    try {
      const data = await updateWorkCategory(work.id, category);
      if (data.work) {
        setWorks((current) => current.map((item) => (
          item.id === work.id ? { ...item, ...data.work } : item
        )));
      }
    } catch (err) {
      setWorks(previousWorks);
      alert(err.message || '保存视频分类失败');
    } finally {
      setCategoryBusyId('');
    }
  }

  async function handleReplaceCover(event, work) {
    event.stopPropagation();
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file || coverBusyId) return;

    setCoverBusyId(work.id);
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const data = await uploadWorkWithProgress(formData, {
        method: 'PUT',
        workId: work.id,
      });
      if (data.work) {
        setWorks((current) => current.map((item) => (
          item.id === work.id ? { ...item, ...data.work } : item
        )));
      }
    } catch (err) {
      alert(err.message || '替换封面失败');
    } finally {
      setCoverBusyId('');
    }
  }

  function toggleSelectedWork(event, workId) {
    event.stopPropagation();
    setSelectedWorkIds((current) => (
      current.includes(workId)
        ? current.filter((id) => id !== workId)
        : [...current, workId]
    ));
  }

  function selectAllVisible() {
    setSelectedWorkIds((current) => [...new Set([...current, ...visibleWorkIds])]);
  }

  function clearSelectedWorks() {
    setSelectedWorkIds([]);
  }

  async function batchSetVisibility(hidden) {
    const ids = selectedWorkIds.filter((id) => works.some((work) => work.id === id));
    if (!ids.length || batchSaving) return;

    const previousWorks = works;
    setBatchSaving(true);
    setWorks((current) => current.map((work) => (
      ids.includes(work.id) ? { ...work, hidden } : work
    )));

    try {
      const results = await Promise.all(ids.map((id) => toggleWorkVisibility(id, hidden)));
      setWorks((current) => current.map((work) => {
        const updated = results.find((result) => result.work?.id === work.id)?.work;
        return updated ? { ...work, ...updated } : work;
      }));
      setSelectedWorkIds([]);
    } catch (err) {
      setWorks(previousWorks);
      alert(err.message || '批量修改失败');
    } finally {
      setBatchSaving(false);
    }
  }

  return (
    <section id="work" className="relative px-6 py-24 md:px-20" style={{ background: '#fff' }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-gray-900" style={{ fontFamily: DISPLAY_TITLE_FONT, fontSize: 'clamp(42px, 4vw, 58px)', fontWeight: 900, lineHeight: 1.1 }}>
            <SplitTitle value={t?.worksTitle} fallback="部分作品" />
          </h2>
          <RichText as="p" value={t?.worksSubtitle} fallback="Selected works across video, image and writing" className="mt-4 text-base font-medium" style={{ color: '#a0a6b3' }} />
          {isLoggedIn && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setArrangeMode((value) => !value);
                  setSelectedMoveId('');
                }}
                className="rounded-full px-4 py-2 text-xs font-semibold transition"
                style={arrangeMode ? { background: acc, color: '#fff', boxShadow: `0 12px 24px ${acc}24` } : { background: '#f7f8fb', color: '#6b7280' }}
              >
                {arrangeMode ? '退出排序模式' : '开启排序模式'}
              </button>
              {arrangeMode && (
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-600">
                  <span>{savingOrder ? '正在保存排序…' : selectedMoveId ? '已选中作品：再点击目标作品即可移动；点击同一张可取消' : '排序模式：先点要移动的作品，再点目标位置'}</span>
                </div>
              )}
              {!arrangeMode && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-45"
                    disabled={!visibleWorkIds.length || batchSaving}
                  >
                    全选当前
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedWorks}
                    className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:-translate-y-0.5 disabled:opacity-45"
                    disabled={!selectedWorkIds.length || batchSaving}
                  >
                    全不选
                  </button>
                  {selectedWorkIds.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => batchSetVisibility(true)}
                        className="rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-600 transition hover:-translate-y-0.5 disabled:opacity-45"
                        disabled={batchSaving}
                      >
                        批量隐藏
                      </button>
                      <button
                        type="button"
                        onClick={() => batchSetVisibility(false)}
                        className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:-translate-y-0.5 disabled:opacity-45"
                        disabled={batchSaving}
                      >
                        批量显示
                      </button>
                      <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">
                        已选 {selectedVisibleCount || selectedWorkIds.length} 个
                      </span>
                    </>
                  )}
                </div>
              )}
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
                  setSelectedMoveId('');
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

        {filter === 'video' && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#a0a6b3' }}>分组</span>
            <button
              onClick={() => setVideoCategory('')}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
              style={!videoCategory ? { background: '#1d2333', color: '#fff' } : { background: '#f1f3f7', color: '#6e7685' }}
            >
              全部视频
            </button>
            {VIDEO_CATEGORIES.map((category) => (
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
              {filter === 'featured' ? '还没有选择精选作品' : <RichText value={t?.worksEmpty} fallback="还没有作品" />}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {displayWorks.map((work) => work.__section ? (
                <div key={work.id} className="col-span-full mt-2 flex items-center gap-3 first:mt-0">
                  <h3 className="text-sm font-bold tracking-wide text-gray-700">
                    {work.__section === 'portrait' ? '竖屏封面' : '横屏封面'}
                  </h3>
                  <span className="h-px flex-1 bg-gray-100" />
                </div>
              ) : (
                <article
                  key={work.id}
                  data-work-card={work.id}
                  className={`group relative select-none rounded-2xl transition-transform hover:-translate-y-1 ${filter === 'image' && imageAspectRatio(work, measuredImageRatios) && imageAspectRatio(work, measuredImageRatios) < 1 ? 'md:col-span-3' : 'md:col-span-4'} ${canArrange ? 'cursor-pointer' : 'cursor-pointer'} ${selectedMoveId === work.id ? 'ring-4 ring-orange-400' : selectedMoveId ? 'ring-2 ring-dashed ring-orange-200' : ''} ${work.hidden ? 'ring-2 ring-dashed ring-gray-300' : ''} ${selectedWorkSet.has(work.id) ? 'ring-4 ring-blue-400' : ''}`}
                  onClick={() => handleWorkClick(work)}
                >
                  <div
                    className={`relative overflow-hidden rounded-2xl ${work.type === 'image' ? '' : 'aspect-video'}`}
                    style={{
                      ...(work.type === 'image' ? { aspectRatio: imageAspectRatio(work, measuredImageRatios) || (16 / 9) } : {}),
                      background: '#0f1322',
                      boxShadow: work.hidden ? '0 18px 36px rgba(15,19,34,0.08)' : '0 24px 48px rgba(15,19,34,0.12)',
                    }}
                  >
                    {work.type === 'image' && work.file_path ? (
                      <img src={assetUrl(work.file_path)} alt={work.title} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${work.hidden ? 'opacity-70 grayscale' : ''}`} loading="lazy" />
                    ) : work.thumbnail ? (
                      <img src={assetUrl(work.thumbnail)} alt={work.title} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${work.hidden ? 'opacity-70 grayscale' : ''}`} loading="lazy" />
                    ) : externalVideoPreviewSrc(work) ? (
                      <video
                        src={externalVideoPreviewSrc(work)}
                        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${work.hidden ? 'opacity-70 grayscale' : ''}`}
                        muted
                        playsInline
                        preload="metadata"
                        aria-label={`${work.title} 视频封面`}
                        onLoadedMetadata={(event) => {
                          const video = event.currentTarget;
                          if (Number.isFinite(video.duration) && video.duration > 0) {
                            video.currentTime = Math.min(0.15, video.duration / 10);
                          }
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(9,12,24,0) 0%, rgba(6,8,18,0.04) 48%, rgba(6,8,18,0.24) 100%)' }} />
                    {isLoggedIn && !canArrange && (
                      <button
                        type="button"
                        onClick={(event) => handleToggleVisibility(event, work)}
                        className="absolute left-4 top-4 z-20 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur transition hover:scale-105"
                        style={{ color: work.hidden ? '#16a34a' : '#4b5563' }}
                        title={work.hidden ? '让游客重新看到这个作品' : '隐藏后游客看不到，登录后仍可管理'}
                      >
                        {work.hidden ? '显示' : '隐藏'}
                      </button>
                    )}
                    {isLoggedIn && !canArrange && (
                      <button
                        type="button"
                        onClick={(event) => handleToggleFeatured(event, work)}
                        disabled={Boolean(featuredBusyId)}
                        className="absolute left-4 top-14 z-20 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                        style={work.featured ? { background: acc, color: '#fff' } : { background: 'rgba(255,255,255,0.95)', color: '#4b5563' }}
                        title={work.featured ? '从精选栏目移除' : '加入精选栏目'}
                      >
                        {featuredBusyId === work.id ? '保存中' : work.featured ? '★ 已精选' : '☆ 设为精选'}
                      </button>
                    )}
                    {isLoggedIn && !canArrange && (
                      <button
                        type="button"
                        onClick={(event) => toggleSelectedWork(event, work.id)}
                        className="absolute right-4 top-4 z-20 flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold shadow-lg backdrop-blur transition hover:scale-105"
                        style={selectedWorkSet.has(work.id) ? { background: '#2563eb', color: '#fff' } : { background: 'rgba(255,255,255,0.95)', color: '#4b5563' }}
                        title="选择作品用于批量隐藏或显示"
                      >
                        {selectedWorkSet.has(work.id) ? '✓' : '选'}
                      </button>
                    )}
                    {canArrange && (
                      <div
                        className="absolute left-4 top-4 z-10 flex select-none items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-700 shadow-lg backdrop-blur"
                        title="点击选择，再点击目标位置排序"
                      >
                        <span className="grid h-4 w-4 grid-cols-2 gap-0.5">
                          {Array.from({ length: 4 }).map((_, index) => <i key={index} className="rounded-sm bg-orange-500" />)}
                        </span>
                        {selectedMoveId === work.id ? '已选中' : '点击移动'}
                      </div>
                    )}
                    {isLoggedIn && !canArrange && work.type === 'video' && (
                      <label
                        className={`absolute bottom-4 left-4 z-20 inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur transition hover:scale-105 ${coverBusyId && coverBusyId !== work.id ? 'pointer-events-none opacity-50' : ''}`}
                        style={{ background: 'rgba(255,255,255,0.95)', color: '#4b5563' }}
                        title="选择一张图片作为新封面"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {coverBusyId === work.id ? '上传中…' : '替换封面'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={Boolean(coverBusyId)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => handleReplaceCover(event, work)}
                        />
                      </label>
                    )}
                    <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-lg text-white opacity-0 transition-opacity group-hover:opacity-100" style={{ background: acc }}>→</div>
                  </div>

                  <div className="relative mt-3 px-1">
                    <h3
                      className="overflow-hidden text-base font-semibold leading-snug"
                      style={{
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        paddingRight: isLoggedIn && !canArrange && work.type === 'video' ? '7.75rem' : undefined,
                        fontFamily: WORK_CARD_TITLE_FONT,
                        color: '#061827',
                      }}
                    >
                      {work.title}
                    </h3>
                    {isLoggedIn && !canArrange && work.type === 'video' && (
                      <select
                        value={work.category || ''}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => handleCategoryChange(event, work)}
                        disabled={categoryBusyId === work.id}
                        aria-label={`${work.title}的视频分类`}
                        className="absolute bottom-[7px] right-1 z-20 w-28 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 shadow-sm outline-none transition hover:border-orange-300 disabled:cursor-wait disabled:opacity-60"
                        title="直接设置视频分类"
                      >
                        <option value="">分类</option>
                        {VIDEO_CATEGORIES.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-400">
                      {work.hidden && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                          已隐藏：游客不可见
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
