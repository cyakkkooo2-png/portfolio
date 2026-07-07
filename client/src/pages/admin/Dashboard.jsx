import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorks, deleteWork } from '../../api';

const typeLabels = { video: '🎬 视频', image: '🖼️ 图片', article: '📝 文章' };

export default function Dashboard() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadWorks() {
    setLoading(true);
    getWorks()
      .then(data => setWorks(data.works))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadWorks(); }, []);

  async function handleDelete(id, title) {
    if (!window.confirm(`确定要删除「${title}」吗？此操作不可恢复。`)) return;
    try {
      await deleteWork(id);
      setWorks(works.filter(w => w.id !== id));
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">📋 作品管理</h1>
        <Link
          to="/admin/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + 上传新作品
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : works.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-400 text-lg mb-4">还没有任何作品</p>
          <Link to="/admin/upload" className="text-blue-600 hover:text-blue-800">上传第一个作品 →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">作品</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">类型</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">日期</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {works.map(work => (
                <tr key={work.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{work.title}</div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{work.description}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{typeLabels[work.type]}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">
                    {new Date(work.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        to={`/admin/edit/${work.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(work.id, work.title)}
                        className="text-sm text-red-500 hover:text-red-700 px-2 py-1"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
