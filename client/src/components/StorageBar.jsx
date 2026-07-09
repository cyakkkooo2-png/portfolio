import { useState, useEffect } from 'react';

export default function StorageBar() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(s => setStats(s)).catch(() => {});
  }, []);
  if (!stats) return null;
  const pct = Math.max(2, parseFloat(stats.percentUsed) || 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#f1f5f9' }}>💾</div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium text-gray-700">存储空间</span>
          <span className="font-semibold text-gray-900">{stats.usedGB} / {stats.totalGB} GB</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: pct > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        </div>
      </div>
    </div>
  );
}
