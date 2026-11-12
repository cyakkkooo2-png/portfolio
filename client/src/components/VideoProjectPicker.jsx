import { useEffect, useState } from 'react';
import { getWorks } from '../api';

export default function VideoProjectPicker({ value, onChange, disabled = false }) {
  const [projects, setProjects] = useState([]);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    getWorks('video').then(({ works = [] }) => {
      if (active) setProjects([...new Set(works.map((work) => String(work.project || '').trim()).filter(Boolean))]);
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, []);
  const fieldClass = 'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50';
  return (
    <div className="space-y-2">
      {projects.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label="已有项目组">
        {projects.map((name) => {
          const active = value.trim() === name;
          return <button key={name} type="button" disabled={disabled} aria-pressed={active} onClick={() => onChange(active ? '' : name)} className="rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50" style={active ? { background: '#2563eb', borderColor: '#2563eb', color: '#fff' } : { background: '#fff', borderColor: '#dbe3ef', color: '#5f6b7a' }}>{name}</button>;
        })}
      </div>}
      <input aria-label="项目组名称" value={value} onChange={(event) => onChange(event.target.value)} maxLength={60} disabled={disabled} className={fieldClass} placeholder="例如：澳门大奖赛" />
      <p className="text-xs text-gray-500">{loadError ? '已有项目暂时加载失败，可以直接填写项目名称。' : '点击已有项目即可填入，也可直接填写新项目名称；再次点击可取消。'}</p>
    </div>
  );
}
