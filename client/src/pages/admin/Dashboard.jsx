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
    { k: '/admin', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>), active: location.pathname === '/admin' },
    { k: '/admin/upload', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>), active: location.pathname === '/admin/upload' },
    { k: '/admin/settings', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>), active: location.pathname === '/admin/settings' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f6fa' }}>
      {/* Sidebar — narrow icon-only */}
      <aside className="w-16 flex-shrink-0 flex flex-col items-center py-4 gap-1" style={{ background: '#1e1e2d' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white font-bold" style={{ background: '#4f8cf7' }}>C</div>
        {navs.map(n => (
          <Link key={n.k} to={n.k}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${n.active ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            style={{ background: n.active ? '#4f8cf7' : 'transparent' }}
            title={n.k === '/admin' ? '概览' : n.k === '/admin/upload' ? '上传' : '设置'}>
            {n.icon}
          </Link>
        ))}
        <div className="flex-1" />
        <a href="/" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors" title="返回首页">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </a>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto admin-scroll">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="搜索文件..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-gray-600 placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/upload" className="px-4 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 transition-opacity no-underline" style={{ background: '#4f8cf7' }}>+ 上传</Link>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#4f8cf7' }}>A</div>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-gray-400">加载中...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Cloud Storage</h1>
                <p className="text-sm text-gray-500 mt-0.5">{works.length} 个文件{search && filtered.length !== works.length ? ` · 筛选 ${filtered.length} 个` : ''}</p>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Storage card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">存储</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{ug.toFixed(2)} GB</p>
                      <p className="text-xs text-gray-400 mt-0.5">共 {tg} GB</p>
                    </div>
                    <svg width="60" height="60" className="transform -rotate-90 flex-shrink-0">
                      <circle cx="30" cy="30" r="24" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                      <circle cx="30" cy="30" r="24" fill="none" stroke="#4f8cf7" strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - pct / 100)}
                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                    </svg>
                  </div>
                </div>

                {/* CPU card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500">CPU 使用率</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{cpu?.percent || 0}<span className="text-sm font-normal text-gray-400">%</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">{cpu?.cores || 0} 核心</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(2, cpu?.percent || 0)}%` }} />
                  </div>
                </div>

                {/* Memory card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500">内存</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{mem?.usedMB || 0}<span className="text-sm font-normal text-gray-400"> MB</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">共 {mem?.totalMB || 0} MB</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.max(2, mem?.percentUsed || 0)}%` }} />
                  </div>
                </div>
              </div>

              {/* File table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">文件名称</div>
                  <div className="col-span-2">类型</div>
                  <div className="col-span-2 text-right">大小</div>
                  <div className="col-span-2">日期</div>
                  <div className="col-span-1" />
                </div>
                {filtered.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-gray-400">
                    {search ? '没有匹配的文件' : '暂无文件'}
                  </div>
                ) : (
                  filtered.map(w => (
                    <div key={w.id} className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <span className="text-lg flex-shrink-0">{w.type === 'video' ? '🎬' : w.type === 'image' ? '🖼️' : '📝'}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{w.title}</p>
                          {w.description && <p className="text-xs text-gray-400 truncate">{w.description}</p>}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {w.type === 'video' ? '视频' : w.type === 'image' ? '图片' : '文章'}
                        </span>
                      </div>
                      <div className="col-span-2 text-right text-sm text-gray-500 tabular-nums">{FB(w.file_size)}</div>
                      <div className="col-span-2 text-sm text-gray-400">{new Date(w.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <Link to={'/admin/edit/' + w.id} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="编辑">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>
                        <button onClick={() => hd(w.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Resume management */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📄 简历管理</h3>
                {resume ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div><p className="text-sm font-medium text-gray-800">{resume.name}</p><p className="text-xs text-gray-400">上传于 {new Date(resume.uploadedAt).toLocaleString('zh-CN')} · {(resume.size / 1024).toFixed(0)} KB</p></div>
                    </div>
                    <div className="flex gap-2">
                      <a href={'https://portfolio-production-913f.up.railway.app' + resume.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 no-underline">查看</a>
                      <button onClick={hrDelete} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">删除</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">尚未上传简历</p>
                    <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">{ru ? '上传中...' : '上传简历 PDF'}<input type="file" accept=".pdf,.doc,.docx" onChange={hrUpload} className="hidden" /></label>
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
