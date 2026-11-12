import { useEffect, useId, useState } from 'react';
import { getWorks } from '../api';

export default function VideoProjectPicker({ value, onChange, disabled = false }) {
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const id = useId();
  useEffect(() => {
    let active = true;
    getWorks('video').then(({ works = [] }) => {
      if (active) setProjects([...new Set(works.map((work) => String(work.project || '').trim()).filter(Boolean))]);
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, []);
  const newProject = creating || Boolean(value && !projects.includes(value));
  const fieldClass = 'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50';
  return (
    <div className="space-y-2">
      <select
        id={id}
        aria-label="选择已有项目或新建项目"
        value={newProject ? 'new' : value ? `project:${value}` : ''}
        disabled={disabled}
        className={fieldClass}
        onChange={(event) => {
          const selected = event.target.value;
          setCreating(selected === 'new');
          onChange(selected.startsWith('project:') ? selected.slice(8) : '');
        }}
      >
        <option value="">未分组</option>
        {projects.map((name) => <option key={name} value={`project:${name}`}>{name}</option>)}
        <option value="new">＋ 新建项目</option>
      </select>
      {newProject && <input autoFocus aria-label="新项目名称" value={value} onChange={(event) => onChange(event.target.value)} maxLength={60} disabled={disabled} className={fieldClass} placeholder="填写新项目名称" />}
      <p className="text-xs text-gray-500">{loadError ? '已有项目暂时加载失败，仍可选择“新建项目”填写名称。' : '选择已有项目，或选择“＋ 新建项目”填写名称。'}</p>
    </div>
  );
}
