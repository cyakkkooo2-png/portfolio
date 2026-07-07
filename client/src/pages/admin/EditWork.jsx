import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWork, updateWork } from '../../api';

export default function EditWork() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [type, setType] = useState('image');
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

  useEffect(() => {
    getWork(id)
      .then(data => {
        const w = data.work;
        setType(w.type);
        setTitle(w.title);
        setDescription(w.description);
        setContent(w.content);
        setTags((w.tags || []).join(', '));
        setExistingFile(w.file_path);
        setExistingCover(w.thumbnail);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入作品标题');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('content', content);
      formData.append('tags', JSON.stringify(
        tags.split(',').map(t => t.trim()).filter(Boolean)
      ));

      if (file) {
        if (type === 'video') {
          formData.append('video', file);
        } else if (type === 'image') {
          formData.append('image', file);
        }
      }

      if (cover) {
        formData.append('cover', cover);
      }

      await updateWork(id, formData);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  if (error && !title) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">✏️ 编辑作品</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
        )}

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">作品类型</label>
          <div className="flex gap-3">
            {[
              { key: 'image', label: '🖼️ 图片' },
              { key: 'video', label: '🎬 视频' },
              { key: 'article', label: '📝 文章' },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  type === t.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* File section */}
        {(type === 'image' || type === 'video') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'video' ? '视频文件' : '图片文件'}
            </label>
            {existingFile && !file && (
              <p className="text-xs text-gray-400 mb-2">
                当前文件: {existingFile.split('/').pop()} (留空则保留原文件)
              </p>
            )}
            <input
              type="file"
              accept={type === 'video' ? 'video/*' : 'image/*'}
              onChange={e => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        )}

        {/* Cover image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">封面图</label>
          {existingCover && !cover && (
            <p className="text-xs text-gray-400 mb-2">
              当前封面: {existingCover.split('/').pop()} (留空则保留原封面)
            </p>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={e => setCover(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Article content */}
        {type === 'article' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文章内容</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={12}
            />
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如: 设计, UI, 插画"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? '保存中...' : '保存修改'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
