import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getWorks, deleteWork, getStats } from '../../api';

const TL={video:'🎬 视频',image:'🖼️ 图片',article:'📝 文章'};
function FB(b){if(!b)return'—';if(b>1073741824)return(b/1073741824).toFixed(2)+' GB';return(b/1048576).toFixed(1)+' MB';}

export default function Dashboard() {
  const [works, setWorks] = useState([]); const [stats, setStats] = useState(null); const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState(null); const [ru, setRu] = useState(false); const [search, setSearch] = useState('');
  const location = useLocation();

  useEffect(() => {
    Promise.all([getWorks(), getStats().catch(() => null), fetch('/api/contact/resume').then(r => r.json()).catch(() => null)])
      .then(([wd, sd, rd]) => { setWorks(wd.works); setStats(sd); setResume(rd); }).finally(() => setLoading(false));
  }, []);

  async function hd(id) { if (!window.confirm('确认删除？')) return; await deleteWork(id); setWorks(prev => prev.filter(w => w.id !== id)); }
  async function hrUpload(e) {
    const f = e.target.files[0]; if (!f) return; setRu(true);
    const t = localStorage.getItem('token'); const fd = new FormData(); fd.append('file', f);
    const res = await fetch('/api/contact/resume', { method: 'POST', headers: { 'Authorization': 'Bearer ' + t }, body: fd });
    if (res.ok) setResume(await res.json()); setRu(false);
  }
  async function hrDelete() {
    await fetch('/api/contact/resume', { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
    setResume(null);
  }

  const tu = works.reduce((s, x) => s + (x.file_size || 0), 0);
  const tg = stats?.totalGB || 50; const ug = tu / 1073741824; const pct = Math.min(100, (ug / tg) * 100);
  const mem = stats?.server?.memory; const cpu = stats?.server?.cpu;

  const filtered = search ? works.filter(w => w.title.toLowerCase().includes(search.toLowerCase())) : works;

  const navs = [
    { k: '/admin', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>), label: '概览', active: location.pathname === '/admin' },
    { k: '/admin/upload', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>), label: '上传', active: location.pathname === '/admin/upload' },
    { k: '/admin/settings', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>), label: '设置', active: location.pathname === '/admin/settings' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2f5' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col py-5" style={{ background: '#16162a' }}>
        {/* Brand */}
        <div className="px-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>C</div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">CCY SPACE</p>
              <p className="text-[10px] text-gray-500 leading-tight">管理后台</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navs.map(n => (
            <Link key={n.k} to={n.k}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
                n.active ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              style={n.active ? { background: 'rgba(99,102,241,0.25)', color: '#a5b4fc' } : {}}>
              {n.icon}
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 mt-auto pt-4 border-t border-white/5">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 no-underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span>返回首页</span>
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto admin-scroll">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="搜索文件..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-gray-600 placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/upload" className="px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-all duration-200 no-underline flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              上传
            </Link>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>A</div>
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  加载中...
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">文件管理</h1>
                <p className="text-sm text-gray-500 mt-0.5">共 {works.length} 个文件{search && filtered.length !== works.length ? ` · 筛选 ${filtered.length} 个` : ''}</p>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Storage card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">存储空间</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{ug.toFixed(2)} <span className="text-sm font-normal text-gray-400">GB</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">共 {tg} GB</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden max-w-[180px]">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, pct)}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <svg width="64" height="64" className="transform -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                        <circle cx="32" cy="32" r="26" fill="none" stroke="url(#gradStorage)" strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 26} strokeDashoffset={2 * Math.PI * 26 * (1 - pct / 100)}
                          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        <defs>
                          <linearGradient id="gradStorage" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{Math.round(pct)}%</span>
                    </div>
                  </div>
                </div>

                {/* CPU card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
                  <p className="text-sm text-gray-500 font-medium">CPU 使用率</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{cpu?.percent || 0}<span className="text-sm font-normal text-gray-400">%</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">{cpu?.cores || 0} 核心</p>
                  <div className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(2, cpu?.percent || 0)}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
                  </div>
                </div>

                {/* Memory card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
                  <p className="text-sm text-gray-500 font-medium">内存</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{mem?.usedMB || 0}<span className="text-sm font-normal text-gray-400"> MB</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">共 {mem?.totalMB || 0} MB</p>
                  <div className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(2, mem?.percentUsed || 0)}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                  </div>
                </div>
              </div>

              {/* File table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">文件列表</h3>
                  <span className="text-xs text-gray-400">{filtered.length} 项</span>
                </div>
                {filtered.length === 0 ? (
                  <div className="px-6 py-20 text-center">
                    <div className="text-4xl mb-3 opacity-30">📂</div>
                    <p className="text-sm text-gray-400">{search ? '没有匹配的文件' : '还没有上传任何文件'}</p>
                    {!search && <Link to="/admin/upload" className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block">上传第一个文件 →</Link>}
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-2.5 bg-gray-50/80 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-5">文件名称</div>
                      <div className="col-span-2">类型</div>
                      <div className="col-span-2 text-right">大小</div>
                      <div className="col-span-2">日期</div>
                      <div className="col-span-1" />
                    </div>
                    {filtered.map(w => (
                      <div key={w.id} className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors group">
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#f1f5f9' }}>
                            {w.type === 'video' ? '🎬' : w.type === 'image' ? '🖼️' : '📝'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{w.title}</p>
                            {w.description && <p className="text-xs text-gray-400 truncate mt-0.5">{w.description}</p>}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: w.type === 'video' ? '#fef2f2' : w.type === 'image' ? '#eff6ff' : '#f0fdf4', color: w.type === 'video' ? '#ef4444' : w.type === 'image' ? '#3b82f6' : '#22c55e' }}>
                            {w.type === 'video' ? '视频' : w.type === 'image' ? '图片' : '文章'}
                          </span>
                        </div>
                        <div className="col-span-2 text-right text-sm text-gray-500 tabular-nums">{FB(w.file_size)}</div>
                        <div className="col-span-2 text-sm text-gray-400">{new Date(w.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={'/admin/edit/' + w.id} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="编辑">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Link>
                          <button onClick={() => hd(w.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Resume management */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="text-base">📄</span> 简历管理
                </h3>
                {resume ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#fef3c7' }}>📄</div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{resume.name}</p>
                        <p className="text-xs text-gray-400">上传于 {new Date(resume.uploadedAt).toLocaleString('zh-CN')} · {(resume.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={'https://portfolio-production-913f.up.railway.app' + resume.url} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors no-underline">查看</a>
                      <button onClick={hrDelete}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">删除</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-400 mb-3">尚未上传简历</p>
                    <label className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all duration-200 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {ru ? '上传中...' : '上传简历 PDF'}
                      <input type="file" accept=".pdf,.doc,.docx" onChange={hrUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
