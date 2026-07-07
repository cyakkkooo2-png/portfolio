import { useState, useEffect } from 'react';
import { getWorks } from '../api';
import WorkCard from '../components/WorkCard';
import FilterBar from '../components/FilterBar';

export default function Home() {
  const [works, setWorks] = useState([]);
  const [activeType, setActiveType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getWorks(activeType || undefined)
      .then(data => setWorks(data.works))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeType]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">我的作品集</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          这里展示我的视频、图片和文章作品。点击任意作品查看详情。
        </p>
      </div>

      {/* Filter */}
      <div className="mb-8">
        <FilterBar activeType={activeType} onTypeChange={setActiveType} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">加载失败: {error}</div>
      ) : works.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-400 text-lg">暂无作品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map(work => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </div>
  );
}
