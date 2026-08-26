import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getWorks, deleteWork, reorderWorks, toggleWorkVisibility } from '../../api';

function formatBytes(bytes) {
  if (!bytes) return '-';
  if (bytes > 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function Dashboard() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchBusy, setBatchBusy] = useState('');
  const [batchMessage, setBatchMessage] = useState(null);
  const location = useLocation();

  useEffect(() => {
    Promise.all([
      getWorks(),
      fetch('/api/contact/resume').then((r) => r.json()).catch(() => null),
    ])
      .then(([workData, resumeData]) => {
        setWorks(workData.works || []);
        setResume(resumeData);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('确定删除这个作品吗？')) return;
    await deleteWork(id);
    setWorks((prev) => prev.filter((work) => work.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
  }

  async function saveOrder(nextWorks) {
    setWorks(nextWorks);
    setSavingOrder(true);
    try {
      const data = await reorderWorks(nextWorks.map((work) => work.id));
      setWorks(data.works || nextWorks);
    } finally {
      setSavingOrder(false);
    }
  }

  async function moveWork(id, direction) {
    if (search) return;
    const index = works.findIndex((work) => work.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= works.length) return;
    const next = [...works];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    await saveOrder(next);
  }

  async function dropWork(targetId) {
    if (!dragId || dragId === targetId || search) return;
    const from = works.findIndex((work) => work.id === dragId);
    const to = works.findIndex((work) => work.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...works];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setDragId('');
    await saveOrder(next);
  }

  async function uploadResume(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/contact/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    });
    if (res.ok) setResume(await res.json());
    setResumeUploading(false);
  }

  async function deleteResume() {
    await fetch('/api/contact/resume', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setResume(null);
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    ));
  }

  function selectAll(ids) {
    setSelectedIds(ids);
  }

  async function handleBatchVisibility(hidden) {
    if (!selectedIds.length || batchBusy) return;
    const action = hidden ? '隐藏' : '显示';
    setBatchBusy(action);
    setBatchMessage(null);
    try {
      const results = await Promise.allSettled(selectedIds.map((id) => toggleWorkVisibility(id, hidden)));
      const data = await getWorks();
      setWorks(data.works || []);
      const succeeded = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      setBatchMessage(failed
        ? { type: 'error', text: `已${action} ${succeeded} 个，${failed} 个未完成` }
        : { type: 'success', text: `已${action} ${succeeded} 个作品` });
    } catch (err) {
      setBatchMessage({ type: 'error', text: err.message || `批量${action}失败` });
    } finally {
      setBatchBusy('');
    }
  }

  async function handleBatchDelete() {
    if (!selectedIds.length || batchBusy) return;
    const ids = [...selectedIds];
    if (!window.confirm(`确定永久删除选中的 ${ids.length} 个作品吗？此操作不可撤销。`)) return;
    setBatchBusy('删除');
    setBatchMessage(null);
    try {
      const results = await Promise.allSettled(ids.map((id) => deleteWork(id)));
      const data = await getWorks();
      const remainingIds = new Set((data.works || []).map((work) => work.id));
      setWorks(data.works || []);
      setSelectedIds((prev) => prev.filter((id) => remainingIds.has(id)));
      const succeeded = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      setBatchMessage(failed
        ? { type: 'error', text: `已删除 ${succeeded} 个，${failed} 个未完成` }
        : { type: 'success', text: `已删除 ${succeeded} 个作品` });
    } catch (err) {
      setBatchMessage({ type: 'error', text: err.message || '批量删除失败，请重试' });
    } finally {
      setBatchBusy('');
    }
  }

  const filtered = search
    ? works.filter((work) => work.title.toLowerCase().includes(search.toLowerCase()))
    : works;
  const canArrange = !search;
  const filteredIds = filtered.map((work) => work.id);
  const selectedCount = selectedIds.length;
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const navs = [
    { k: '/admin', label: '概览', icon: (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" /></svg>) },
    { k: '/admin/upload', label: '上传', icon: (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>) },
    { k: '/admin/settings', label: '设置', icon: (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: '#f5f6fa' }}>
      <aside className="flex w-16 flex-shrink-0 flex-col items-center gap-1 py-4" style={{ background: '#1e1e2d' }}>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: '#4f8cf7' }}>C</div>
        {navs.map((nav) => {
          const active = location.pathname === nav.k;
          return (
            <Link
              key={nav.k}
              to={nav.k}
              title={nav.label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              style={{ background: active ? '#4f8cf7' : 'transparent' }}
            >
              {nav.icon}
            </Link>
          );
        })}
        <div className="flex-1" />
        <a href="/" className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:text-gray-300" title="返回首页">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </a>
      </aside>

      <div className="admin-scroll flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-6">
          <div className="flex max-w-md flex-1 items-center gap-3">
            <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="搜索作品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-3">
            {savingOrder && <span className="text-xs text-gray-400">正在保存排序...</span>}
            <Link to="/admin/upload" className="rounded-lg px-4 py-1.5 text-xs font-medium text-white no-underline transition-opacity hover:opacity-90" style={{ background: '#4f8cf7' }}>+ 上传</Link>
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: '#4f8cf7' }}>A</div>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-gray-400">加载中...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">作品排序</h2>
                    <p className="mt-0.5 text-xs text-gray-400">{canArrange ? '拖动左侧手柄，或用上下按钮调整前台展示顺序。' : '搜索状态下暂时不能调整排序。'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-6 py-3">
                  <button
                    type="button"
                    onClick={() => selectAll(filteredIds)}
                    disabled={!filteredIds.length || allFilteredSelected || Boolean(batchBusy)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {search ? '全选搜索结果' : '全选'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    disabled={!selectedCount || Boolean(batchBusy)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    全不选
                  </button>
                  <span className="mr-auto text-xs text-gray-400">已选 {selectedCount} 项</span>
                  {batchMessage && (
                    <span className={`text-xs ${batchMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                      {batchMessage.text}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleBatchVisibility(false)}
                    disabled={!selectedCount || Boolean(batchBusy)}
                    className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {batchBusy === '显示' ? '处理中...' : '批量显示'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchVisibility(true)}
                    disabled={!selectedCount || Boolean(batchBusy)}
                    className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {batchBusy === '隐藏' ? '处理中...' : '批量隐藏'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    disabled={!selectedCount || Boolean(batchBusy)}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {batchBusy === '删除' ? '删除中...' : '批量删除'}
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="col-span-4">文件名称</div>
                  <div className="col-span-2">类型</div>
                  <div className="col-span-2 text-right">大小</div>
                  <div className="col-span-2">日期</div>
                  <div className="col-span-2" />
                </div>
                {filtered.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-gray-400">
                    {search ? '没有匹配的作品' : '暂无作品'}
                  </div>
                ) : (
                  filtered.map((work, index) => (
                    <div
                      key={work.id}
                      draggable={canArrange}
                      onDragStart={() => canArrange && setDragId(work.id)}
                      onDragOver={(event) => canArrange && event.preventDefault()}
                      onDrop={() => dropWork(work.id)}
                      onDragEnd={() => setDragId('')}
                      className={`grid grid-cols-12 items-center gap-4 border-b border-gray-50 px-6 py-3 transition-colors hover:bg-gray-50/50 ${selectedIds.includes(work.id) ? 'bg-blue-50/60' : ''} ${dragId === work.id ? 'opacity-70' : ''}`}
                    >
                      <div className="col-span-4 flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(work.id)}
                          onChange={() => toggleSelected(work.id)}
                          disabled={Boolean(batchBusy)}
                          aria-label={`选择${work.title}`}
                          className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          disabled={!canArrange || savingOrder}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title="拖拽排序"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" />
                          </svg>
                        </button>
                        <span className="flex-shrink-0 text-lg">{work.type === 'video' ? '🎬' : work.type === 'image' ? '🖼️' : '📄'}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{work.title}</p>
                          {work.description && <p className="truncate text-xs text-gray-400">{work.description}</p>}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {work.type === 'video' ? '视频' : work.type === 'image' ? '图片' : '文章'}
                        </span>
                        {work.hidden && <span className="ml-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">已隐藏</span>}
                      </div>
                      <div className="col-span-2 text-right text-sm tabular-nums text-gray-500">{formatBytes(work.file_size)}</div>
                      <div className="col-span-2 text-sm text-gray-400">{new Date(work.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <button
                          onClick={() => moveWork(work.id, -1)}
                          disabled={!canArrange || savingOrder || index === 0}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-25"
                          title="上移"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          onClick={() => moveWork(work.id, 1)}
                          disabled={!canArrange || savingOrder || index === filtered.length - 1}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-25"
                          title="下移"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <Link to={`/admin/edit/${work.id}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="编辑">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>
                        <button onClick={() => handleDelete(work.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="删除">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">📄 简历管理</h3>
                {resume ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{resume.name}</p>
                        <p className="text-xs text-gray-400">上传于 {new Date(resume.uploadedAt).toLocaleString('zh-CN')} · {(resume.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={resume.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 no-underline hover:bg-blue-100">查看</a>
                      <button onClick={deleteResume} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">删除</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-sm text-gray-400">尚未上传简历</p>
                    <label className="inline-block cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      {resumeUploading ? '上传中...' : '上传简历 PDF'}
                      <input type="file" accept=".pdf,.doc,.docx" onChange={uploadResume} className="hidden" />
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
