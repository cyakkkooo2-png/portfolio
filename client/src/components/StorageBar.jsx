import { useState, useEffect } from 'react';

export default function StorageBar() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(s => setStats(s)).catch(() => {});
  }, []);
  if (!stats) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#f1f5f9' }}>💾</div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">媒体存储</span>
          <span className="font-semibold text-gray-900">{stats.usedGB} GB</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">视频使用腾讯云点播，按实际存储用量计费</p>
      </div>
    </div>
  );
}
