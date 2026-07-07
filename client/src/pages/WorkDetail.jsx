import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWork } from '../api';
import VideoPlayer from '../components/VideoPlayer';
import ImageGallery from '../components/ImageGallery';
import ArticleViewer from '../components/ArticleViewer';

const typeLabels = { video: '视频', image: '图片', article: '文章' };

export default function WorkDetail() {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getWork(id)
      .then(data => setWork(data.work))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">加载失败: {error}</div>;
  }

  if (!work) {
    return <div className="text-center py-20 text-gray-400">作品不存在</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link to="/" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← 返回作品列表
      </Link>

      {/* Title & Meta */}
      <div className="mb-6">
        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
          {typeLabels[work.type]}
        </span>
        <h1 className="text-3xl font-bold text-gray-800 mt-2 mb-2">{work.title}</h1>
        {work.description && (
          <p className="text-gray-500">{work.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          发布于 {new Date(work.created_at).toLocaleDateString('zh-CN')}
        </p>
        {work.tags && work.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {work.tags.map(tag => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Content by type */}
      {work.type === 'video' && <VideoPlayer src={work.file_path} title={work.title} />}
      {work.type === 'image' && <ImageGallery src={work.file_path} title={work.title} />}
      {work.type === 'article' && (
        <div>
          {work.thumbnail && (
            <img src={work.thumbnail} alt={work.title} className="w-full max-h-64 object-cover rounded-lg mb-6" />
          )}
          <ArticleViewer content={work.content} title={work.title} />
        </div>
      )}
    </div>
  );
}
