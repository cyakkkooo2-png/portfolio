import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadWorkWithProgress } from '../../api';
import ProgressBar from '../../components/ProgressBar';
import StorageBar from '../../components/StorageBar';

export default function UploadWork() {
  const navigate = useNavigate();
  const [type, setType] = useState('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return setError('请输入标题');
    if (type !== 'article' && !file) return setError('请选择文件');
    if (type === 'article' && !content.trim()) return setError('请输入内容');

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
        method: 'POST',
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
      setError(err.message || '上传失败');
    } finally { setUploading(false); }
  }

  const cls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen" style={{ background: '#13151a' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <a href="/admin" className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block">← 返回管理</a>
        <h1 className="text-2xl font-bold text-white mb-2">📤 上传内容</h1>
        <p className="text-sm text-gray-400 mb-6">上传视频、图片或文章</p>

        <div className="space-y-5">
          <StorageBar />
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
              <div className="flex gap-3">
                {[{ key: 'video', label: '🎬 视频' }, { key: 'image', label: '🖼️ 图片' }, { key: 'article', label: '📝 文章' }].map(t => (
                  <button key={t.key} type="button" onClick={() => setType(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${type === t.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>{t.label}</button>
                ))}
              </div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={cls} placeholder="输入标题" required /></div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={cls} placeholder="简短描述..." /></div>

            {type !== 'article' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{type === 'video' ? '视频文件 *' : '图片文件 *'}</label>
                <input type="file" accept={type === 'video' ? 'video/*' : 'image/*'} onChange={e => setFile(e.target.files[0])}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700" />
                {file && <p className="text-xs text-gray-400 mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
              </div>
            )}

            <div><label className="block text-sm font-medium text-gray-700 mb-1">封面图（可选）</label>
              <input type="file" accept="image/*" onChange={e => setCover(e.target.files[0])}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700" /></div>

            {type === 'article' && (
              <div><label className="block text-sm font-medium text-gray-700 mb-1">文章内容 *</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={10}
                  className={"font-mono text-sm " + cls} placeholder="## 标题&#10;&#10;正文..." required /></div>
            )}

            <div><label className="block text-sm font-medium text-gray-700 mb-1">标签（逗号分隔）</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} className={cls} placeholder="设计, UI, 插画" /></div>

            {uploading && progress && <ProgressBar percent={progress.percent} fileName={progress.fileName} speed={progress.speed} />}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={uploading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {uploading ? '上传中...' : '上传'}
              </button>
              <button type="button" onClick={() => navigate('/admin')}
                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors">取消</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
