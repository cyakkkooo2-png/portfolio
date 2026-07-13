import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWork } from '../api';
import VideoPlayer from '../components/VideoPlayer';
import ImageGallery from '../components/ImageGallery';
import ArticleViewer from '../components/ArticleViewer';

const typeLabels = { video: '视频', image: '图片', article: '文章' };

function assetUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return `/api/works/proxy-image?url=${encodeURIComponent(`https:${url}`)}`;
  if (/^https?:\/\//i.test(url)) return `/api/works/proxy-image?url=${encodeURIComponent(url)}`;
  return url;
}

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
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080c' }}>
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080c' }}>
        <div className="text-red-400">加载失败: {error}</div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080c' }}>
        <div className="text-gray-400">作品不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#08080c' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 mb-6 inline-block transition-colors no-underline">
          ← 返回作品列表
        </Link>

        {/* Title & Meta */}
        <div className="mb-8">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
            {typeLabels[work.type]}
          </span>
          <h1 className="text-3xl font-bold text-white mt-3 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{work.title}</h1>
          {work.description && (
            <p className="text-gray-400 leading-relaxed">{work.description}</p>
          )}
          <p className="text-xs text-gray-600 mt-3">
            发布于 {new Date(work.created_at).toLocaleDateString('zh-CN')}
          </p>
          {work.tags && work.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {work.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.15)' }}>#{tag}</span>
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
              <img src={assetUrl(work.thumbnail)} alt={work.title} className="w-full max-h-64 object-cover rounded-2xl mb-6" />
            )}
            <ArticleViewer content={work.content} title={work.title} />
            {(work.external_url || work.source_url) && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white">
                <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500">站内浏览文章</span>
                  <a href={work.external_url || work.source_url} className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white no-underline" target="_self">
                    打开原网页
                  </a>
                </div>
                <iframe
                  src={work.external_url || work.source_url}
                  title={work.title}
                  className="h-[72vh] w-full bg-white"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
