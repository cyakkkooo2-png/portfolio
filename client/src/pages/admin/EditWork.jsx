import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWork, uploadWorkWithProgress } from '../../api';
import ProgressBar from '../../components/ProgressBar';

export default function EditWork() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [type, setType] = useState('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [existingFile, setExistingFile] = useState('');
  const [existingCover, setExistingCover] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    getWork(id).then(d => {
      const w = d.work;
      setType(w.type); setTitle(w.title); setDescription(w.description);
      setContent(w.content); setTags((w.tags || []).join(', '));
      setExistingFile(w.file_path); setExistingCover(w.thumbnail);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return setError('请输入标题');
    setUploading(true); setError('');
    const fName = file?.name || title;
    setProgress({ percent: 0, speed: '', fileName: fName });
    let timer = null, lastPct = 0;

    try {
      const fd = new FormData();
      fd.append('title', title); fd.append('description', description);
      fd.append('type', type); fd.append('content', content);
      fd.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      if (file) fd.append(type === 'video' ? 'video' : 'image', file);
      if (cover) fd.append('cover', cover);

      await uploadWorkWithProgress(fd, {
        method: 'PUT', workId: id,
        onProgress: p => {
          lastPct = p.percent;
          setProgress({ percent: p.percent, speed: p.speed || '', fileName: fName });
          if (p.percent >= 90 && !timer) {
            timer = setInterval(() => {
              lastPct = Math.min(99, lastPct + 1);
              setProgress({ percent: lastPct, speed: '保存至云存储...', fileName: fName });
            }, 800);
          }
        },
      });
      if (timer) clearInterval(timer);
      setProgress({ percent: 100, speed: '', fileName: fName });
      await new Promise(r => setTimeout(r, 500));
      navigate('/admin');
    } catch (err) {
      if (timer) clearInterval(timer);
      setError(err.message || '保存失败');
    } finally { setUploading(false); }
  }

  const inpCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50/50";

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2f5' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col py-5" style={{ background: '#16162a' }}>
        <div className="px-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>C</div>
            <div><p className="text-sm font-semibold text-white leading-tight">CCY SPACE</p><p className="text-[10px] text-gray-500 leading-tight">管理后台</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          <a href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 no-underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>概览
          </a>
          <a href="/admin/upload" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 no-underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>上传
          </a>
          <a href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 no-underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>设置
          </a>
        </nav>
        <div className="px-3 mt-auto pt-4 border-t border-white/5">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 no-underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>返回首页
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto admin-scroll">
        <header className="h-16 flex items-center px-8 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-900">✏️ 编辑内容</h1>
        </header>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">加载中...</div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{error}</div>}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">类型</label>
                <div className="flex gap-2">
                  {[{ key: 'video', label: '🎬 视频' }, { key: 'image', label: '🖼️ 图片' }, { key: 'article', label: '📝 文章' }].map(tp => (
                    <button key={tp.key} type="button" onClick={() => setType(tp.key)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                        type === tp.key ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                      style={type === tp.key ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                      {tp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">标题 *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inpCls} required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">描述</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inpCls} /></div>

              {type !== 'article' && (
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">{type === 'video' ? '视频' : '图片'}</label>
                  {existingFile && !file && <p className="text-xs text-gray-400 mb-2">当前: {existingFile.split('/').pop()}</p>}
                  <div className="mt-1.5 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
                    <input type="file" accept={type === 'video' ? 'video/*' : 'image/*'} onChange={e => setFile(e.target.files[0])}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700" />
                  </div>
                </div>
              )}

              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">封面图</label>
                {existingCover && !cover && <p className="text-xs text-gray-400 mb-2">当前: {existingCover.split('/').pop()}</p>}
                <input type="file" accept="image/*" onChange={e => setCover(e.target.files[0])}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700" /></div>

              {type === 'article' && (
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">文章内容</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} rows={10}
                    className={"font-mono text-sm " + inpCls} /></div>
              )}

              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">标签（逗号分隔）</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} className={inpCls} /></div>

              {uploading && progress && <ProgressBar percent={progress.percent} fileName={progress.fileName} speed={progress.speed} />}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={uploading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {uploading ? '保存中...' : '保存修改'}
                </button>
                <button type="button" onClick={() => navigate('/admin')}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">取消</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
