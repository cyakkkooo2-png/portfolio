import { useState, useEffect, useRef } from 'react';

export default function ProgressBar({ percent, fileName, speed }) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => { setElapsed(Math.floor((Date.now() - startRef.current) / 1000)); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const msg = pct < 30 ? '上传中...' : pct < 70 ? '传输中...' : pct < 95 ? '即将完成...' : pct < 100 ? '保存中...' : '✅ 完成';

  return (
    <div className="bg-blue-50/60 rounded-xl border border-blue-100 p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 font-medium truncate max-w-[70%]">📤 {fileName || '上传中...'}</span>
        <span className="text-blue-600 font-bold tabular-nums">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, background: pct < 100 ? 'linear-gradient(90deg, #3b82f6, #6366f1)' : 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{msg}</span>
        {elapsed > 0 && <span>已用 {elapsed}s</span>}
      </div>
    </div>
  );
}
