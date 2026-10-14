import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteAnalyticsVisitor, getAnalyticsGeo, getAnalyticsOverview, getAnalyticsTrends, getAnalyticsVisitor,
  getAnalyticsVisitors, getAnalyticsWork, getAnalyticsWorks, getWorks, updateAnalyticsVisitorNote,
} from '../../api';
import { allVisitorIds, toggleVisitorSelection, visitorListClassName } from '../../utils/analytics-layout';
import { normalizeVisitorNote } from '../../utils/visitor-note';

const TABS = [
  ['overview', '数据总览'], ['works', '作品分析'], ['visitors', '访客轨迹'], ['geo', '地域与来源'],
];

function localDate(offset = 0) {
  const date = new Date(Date.now() + offset * 86400000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function number(value, digits = 0) {
  return Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: digits });
}

function seconds(value) {
  const total = Math.round(Number(value || 0));
  return total >= 3600 ? `${Math.floor(total / 3600)}:${String(Math.floor(total % 3600 / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` : `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function dateTime(value) {
  if (!value) return '未知时间';
  return new Date(value).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function Metric({ label, value, note }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>{note && <p className="mt-2 text-xs text-slate-400">{note}</p>}</div>;
}

function Bars({ rows = [], valueKey = 'uv' }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));
  return <div className="flex h-48 items-end gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    {rows.length ? rows.map((row) => <div key={row.day} className="flex min-w-0 flex-1 flex-col items-center gap-2" title={`${row.day}: ${row[valueKey] || 0}`}>
      <div className="w-full rounded-t bg-blue-500" style={{ height: `${Math.max(4, Number(row[valueKey] || 0) / max * 140)}px` }} />
      <span className="max-w-full truncate text-[10px] text-slate-400">{row.day?.slice(5)}</span>
    </div>) : <p className="m-auto text-sm text-slate-400">当前日期范围暂无数据</p>}
  </div>;
}

function WorkTable({ rows, names, onSelect }) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm"><table className="min-w-[920px] w-full text-left text-sm">
    <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['作品', '曝光', '点击', '点击率', '播放', '平均观看', '3秒跳出', '完播率', '外部跳转'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
    <tbody>{rows.map((row) => <tr key={row.work_id} className="cursor-pointer border-t border-slate-50 hover:bg-blue-50/40" onClick={() => onSelect(row)}>
      <td className="max-w-[260px] truncate px-4 py-3 font-semibold text-slate-800">{names[row.work_id] || row.work_id}</td>
      <td className="px-4 py-3">{number(row.impressions)}</td><td className="px-4 py-3">{number(row.opens)}</td>
      <td className="px-4 py-3">{row.impressions ? number(row.opens / row.impressions * 100, 1) : '0'}%</td>
      <td className="px-4 py-3">{number(row.plays)}</td><td className="px-4 py-3">{seconds(row.avg_watch_seconds)}</td><td className="px-4 py-3">{number(row.short_bounce_rate, 1)}%</td>
      <td className="px-4 py-3">{number(row.completion_rate, 1)}%</td><td className="px-4 py-3">{number(row.external_jumps)}</td>
    </tr>)}</tbody>
  </table></div>;
}

function Retention({ detail }) {
  if (!detail) return null;
  return <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h3 className="font-bold text-slate-800">观众留存曲线</h3>
    <div className="mt-5 flex h-44 items-end gap-px overflow-hidden">{detail.retention?.map((bucket) => <div key={bucket.second} className="min-w-[2px] flex-1 bg-orange-500" style={{ height: `${Math.max(2, bucket.retention)}%` }} title={`${seconds(bucket.second)} · ${number(bucket.retention, 1)}%`} />)}</div>
    <div className="mt-2 flex justify-between text-xs text-slate-400"><span>0:00</span><span>结束</span></div>
  </div>;
}

const EVENT_LABELS = { page_view: '进入网站', work_impression: '看到作品', work_open: '打开作品', video_start: '开始播放', video_pause: '暂停', video_resume: '继续播放', video_seek: '拖动进度', video_heartbeat: '持续观看', video_complete: '播放完成', work_close: '退出作品', external_jump: '跳转外部平台', external_return: '从外部平台返回', session_end: '离开网站' };

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState('overview');
  const [start, setStart] = useState(localDate(-29));
  const [end, setEnd] = useState(localDate());
  const [includeInternal, setIncludeInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({ metrics: {} });
  const [trends, setTrends] = useState([]);
  const [workRows, setWorkRows] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sources, setSources] = useState([]);
  const [devices, setDevices] = useState([]);
  const [workNames, setWorkNames] = useState({});
  const [selectedWork, setSelectedWork] = useState(null);
  const [workDetail, setWorkDetail] = useState(null);
  const [visitorDetail, setVisitorDetail] = useState(null);
  const [deletingVisitor, setDeletingVisitor] = useState(false);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState([]);
  const [editingVisitorId, setEditingVisitorId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const cancelNoteRef = useRef(false);

  const query = useMemo(() => `?start=${start}&end=${end}&include_internal=${includeInternal}`, [start, end, includeInternal]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAnalyticsOverview(query), getAnalyticsTrends(query), getAnalyticsWorks(query), getAnalyticsVisitors(query), getAnalyticsGeo(query), getWorks()])
      .then(([o, t, w, v, g, allWorks]) => {
        setOverview(o); setTrends(t.trends || []); setWorkRows(w.works || []); setVisitors(v.visitors || []); setLocations(g.locations || []); setSources(g.sources || []); setDevices(g.devices || []);
        setSelectedVisitorIds((ids) => ids.filter((id) => (v.visitors || []).some((visitor) => visitor.visitor_id === id)));
        setWorkNames(Object.fromEntries((allWorks.works || []).map((work) => [work.id, work.title])));
      }).finally(() => setLoading(false));
  }, [query, refreshKey]);

  async function openWork(row) { setSelectedWork(row); setWorkDetail(await getAnalyticsWork(row.work_id, query)); }
  async function openVisitor(visitor) { setVisitorDetail(await getAnalyticsVisitor(visitor.visitor_id, query)); }
  function beginVisitorNote(event, visitor) {
    event.stopPropagation();
    cancelNoteRef.current = false;
    setEditingVisitorId(visitor.visitor_id);
    setNoteDraft(visitor.note || '');
  }
  async function saveVisitorNote(visitor) {
    if (cancelNoteRef.current) {
      cancelNoteRef.current = false;
      return;
    }
    const note = normalizeVisitorNote(noteDraft);
    setEditingVisitorId('');
    try {
      await updateAnalyticsVisitorNote(visitor.visitor_id, note);
      setVisitors((items) => items.map((item) => item.visitor_id === visitor.visitor_id ? { ...item, note } : item));
      setVisitorDetail((detail) => detail?.visitor_id === visitor.visitor_id ? { ...detail, note } : detail);
    } catch (error) {
      window.alert(error.message || '备注保存失败，请稍后重试');
    }
  }
  async function removeVisitor(visitor) {
    if (!visitor || deletingVisitor) return;
    const displayName = visitor.note || visitor.visitor_id.slice(0, 12);
    if (!window.confirm(`确定永久删除访客 ${displayName}？\n\n该访客的全部会话、操作轨迹和视频观看记录都会一起删除，且无法恢复。`)) return;
    setDeletingVisitor(true);
    try {
      await deleteAnalyticsVisitor(visitor.visitor_id);
      setSelectedVisitorIds((ids) => ids.filter((id) => id !== visitor.visitor_id));
      setVisitorDetail((detail) => detail?.visitor_id === visitor.visitor_id ? null : detail);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      window.alert(error.message || '删除失败，请稍后重试');
    } finally {
      setDeletingVisitor(false);
    }
  }
  async function removeSelectedVisitors() {
    if (!selectedVisitorIds.length || deletingVisitor) return;
    if (!window.confirm(`确定永久删除已选的 ${selectedVisitorIds.length} 位访客？\n\n他们的全部会话、操作轨迹和视频观看记录都会一起删除，且无法恢复。`)) return;
    setDeletingVisitor(true);
    const deletingIds = [...selectedVisitorIds];
    try {
      const results = await Promise.allSettled(deletingIds.map((id) => deleteAnalyticsVisitor(id)));
      const failedIds = deletingIds.filter((_, index) => results[index].status === 'rejected');
      setSelectedVisitorIds(failedIds);
      setVisitorDetail((detail) => detail && !failedIds.includes(detail.visitor_id) && deletingIds.includes(detail.visitor_id) ? null : detail);
      setRefreshKey((value) => value + 1);
      if (failedIds.length) window.alert(`${deletingIds.length - failedIds.length} 位访客已删除，${failedIds.length} 位删除失败，请稍后重试。`);
    } finally {
      setDeletingVisitor(false);
    }
  }
  async function exportCsv() {
    const response = await fetch(`/api/analytics/export${query}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = 'ccyspace-analytics.csv'; link.click(); URL.revokeObjectURL(url);
  }
  const m = overview.metrics || {};

  return <div className="analytics-dashboard min-h-screen bg-slate-50 text-slate-900">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-4">
        <Link to="/admin" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white no-underline">← 后台</Link>
        <div className="mr-auto"><h1 className="text-xl font-bold">数据中心</h1><p className="text-xs text-slate-400">访客、作品与播放表现</p></div>
        <input type="date" value={start} onChange={(event) => setStart(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <span className="text-slate-300">—</span>
        <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={includeInternal} onChange={(event) => setIncludeInternal(event.target.checked)} />显示内部访问</label>
        <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">导出 CSV</button>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-7">
      <nav className="mb-6 flex gap-2 overflow-x-auto">{TABS.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 shadow-sm'}`}>{label}</button>)}</nav>
      {loading ? <div className="py-24 text-center text-slate-400">正在读取数据…</div> : <>
        {tab === 'overview' && <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="访问人数 UV" value={number(m.uv)} note={`${number(m.sessions)} 次会话`} /><Metric label="作品点击" value={number(m.work_opens)} note={`${number(m.plays)} 次有效播放`} />
          <Metric label="平均观看时长" value={seconds(m.avg_watch_seconds)} note={`平均进度 ${number(m.avg_progress, 1)}%`} /><Metric label="完播率" value={`${number(m.completion_rate, 1)}%`} note={`${number(m.external_jumps)} 次外部跳转`} />
        </div><div><h2 className="mb-3 font-bold">访问趋势</h2><Bars rows={trends} /></div><div><h2 className="mb-3 font-bold">热门作品</h2><WorkTable rows={workRows.slice(0, 8)} names={workNames} onSelect={openWork} /></div></div>}
        {tab === 'works' && <><WorkTable rows={workRows} names={workNames} onSelect={openWork} />{selectedWork && <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">正在查看：{workNames[selectedWork.work_id] || selectedWork.work_id}</div>}<Retention detail={workDetail} /></>}
        {tab === 'visitors' && <div className="grid items-start gap-5 lg:grid-cols-[380px_1fr]"><div data-testid="visitor-list" className={visitorListClassName()}><div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur"><button type="button" onClick={() => setSelectedVisitorIds(allVisitorIds(visitors))} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100">全选</button><button type="button" onClick={() => setSelectedVisitorIds([])} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">全不选</button><button type="button" onClick={removeSelectedVisitors} disabled={!selectedVisitorIds.length || deletingVisitor} className="ml-auto rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">{deletingVisitor ? '正在删除…' : `删除已选（${selectedVisitorIds.length}）`}</button></div>{visitors.map((visitor) => <div key={visitor.visitor_id} role="button" tabIndex={0} onClick={() => openVisitor(visitor)} onKeyDown={(event) => { if (event.key === 'Enter' && editingVisitorId !== visitor.visitor_id) openVisitor(visitor); }} className="relative w-full cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 pr-20 text-left shadow-sm hover:border-blue-200"><div className="absolute right-3 top-3 flex items-center gap-2"><input type="checkbox" checked={selectedVisitorIds.includes(visitor.visitor_id)} onChange={() => setSelectedVisitorIds((ids) => toggleVisitorSelection(ids, visitor.visitor_id))} onClick={(event) => event.stopPropagation()} aria-label={`选择访客 ${visitor.note || visitor.visitor_id.slice(0, 12)}`} className="h-4 w-4 cursor-pointer accent-blue-600" /><button type="button" disabled={deletingVisitor} onClick={(event) => { event.stopPropagation(); removeVisitor(visitor); }} aria-label={`删除访客 ${visitor.note || visitor.visitor_id.slice(0, 12)}`} title="删除访客" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg></button></div><div onDoubleClick={(event) => beginVisitorNote(event, visitor)} title="双击添加或修改备注">{editingVisitorId === visitor.visitor_id ? <input autoFocus value={noteDraft} maxLength={30} onChange={(event) => setNoteDraft(event.target.value)} onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()} onBlur={() => saveVisitorNote(visitor)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { cancelNoteRef.current = true; setEditingVisitorId(''); event.currentTarget.blur(); } }} className="w-full rounded-lg border border-blue-300 px-2 py-1 text-sm font-semibold text-slate-800 outline-none ring-blue-100 focus:ring-4" placeholder="输入备注名" /> : <><p className={`${visitor.note ? 'text-sm' : 'font-mono text-xs'} font-bold text-slate-700`}>{visitor.note || visitor.visitor_id.slice(0, 12)}</p>{visitor.note && <p className="mt-1 font-mono text-[10px] text-slate-400">{visitor.visitor_id.slice(0, 12)}</p>}</>}</div><p className="mt-2 text-xs text-slate-400">{visitor.city || '未知地区'}{visitor.district ? ` · ${visitor.district}` : ''} · {visitor.device_type}</p><p className="mt-1 text-xs font-medium text-slate-600">最近进入：{dateTime(visitor.last_entered_at)}</p><p className="mt-1 text-xs text-slate-400">首次进入：{dateTime(visitor.first_seen_at)} · {visitor.session_count} 次访问</p></div>)}</div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">{visitorDetail ? <><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">{visitorDetail.note || '匿名访客'} <span className="font-mono text-xs font-normal text-slate-400">{visitorDetail.visitor_id.slice(0, 12)}</span></h3></div><p className="mt-2 text-xs text-slate-400">删除请使用左侧访客卡片右上角的垃圾桶图标。</p><div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">进入时间</p><div className="mt-2 flex flex-wrap gap-2">{visitorDetail.sessions.map((session) => <span key={session.session_id} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">{dateTime(session.started_at)}</span>)}</div></div><div className="mt-5 space-y-4">{visitorDetail.events.map((event) => <div key={event.event_id} className="border-l-2 border-blue-200 pl-4"><p className="text-sm font-semibold text-slate-700">{EVENT_LABELS[event.event_type] || event.event_type}{event.work_id ? ` · ${workNames[event.work_id] || event.work_id}` : ''}</p><p className="mt-1 text-xs text-slate-400">{dateTime(event.occurred_at)}{event.position_seconds != null ? ` · ${seconds(event.position_seconds)}` : ''}{event.target_platform ? ` · ${event.target_platform}` : ''}{event.event_type === 'external_return' && event.metadata?.away_seconds ? ` · 离开 ${seconds(event.metadata.away_seconds)}` : ''}</p></div>)}</div></> : <p className="py-20 text-center text-sm text-slate-400">选择一位访客查看完整操作轨迹</p>}</div></div>}
        {tab === 'geo' && <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="mb-5 font-bold">城市 / 区县</h2><div className="space-y-4">{locations.map((place) => <div key={`${place.city}-${place.district}`}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{place.city}{place.district ? ` · ${place.district}` : ''}</span><span className="text-slate-400">{place.visitors} 人 · 平均 {seconds(place.avg_active_seconds)}</span></div><div className="h-2 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-blue-500" style={{ width: `${Math.max(3, place.visitors / Math.max(1, locations[0]?.visitors) * 100)}%` }} /></div></div>)}</div></div><div className="space-y-5"><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">访问来源</h2>{sources.map((source) => <div key={source.source} className="flex justify-between border-b border-slate-50 py-2 text-sm"><span>{source.source}</span><b>{source.sessions}</b></div>)}</div><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">设备</h2>{devices.map((device) => <div key={device.device} className="flex justify-between border-b border-slate-50 py-2 text-sm"><span>{device.device === 'mobile' ? '手机 / 平板' : device.device === 'desktop' ? '电脑' : '其他'}</span><b>{device.sessions}</b></div>)}</div></div></div>}
      </>}
    </main>
  </div>;
}
