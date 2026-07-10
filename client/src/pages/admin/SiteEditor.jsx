import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const FONTS = ['Playfair Display', 'Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'SimHei', 'KaiTi', 'Arial', 'Georgia'];

function textOf(data) {
  if (!data) return '';
  return typeof data === 'string' ? data : data.text || '';
}

function normalizeChars(text, chars) {
  const source = Array.isArray(chars) ? chars : [];
  return Array.from(text).map((_, i) => source[i] || {});
}

function sameTheme(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function FontSelect({ value, onChange }) {
  const isCustom = value && !FONTS.includes(value);
  return (
    <div className="flex">
      <select value={isCustom ? '__custom__' : (value || 'Inter')} onChange={(e) => { if (e.target.value !== '__custom__') onChange(e.target.value); }} className="w-1/2 rounded-l-lg border border-gray-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100">
        {FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
        <option value="__custom__">自定义...</option>
      </select>
      <input value={isCustom ? value : ''} onChange={(e) => onChange(e.target.value || 'Inter')} placeholder="字体名" className="w-1/2 rounded-r-lg border border-l-0 border-gray-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
    </div>
  );
}

function RichFieldEditor({ label, data, onChange }) {
  const d = typeof data === 'object' && data ? data : { text: data || '' };
  const text = textOf(d);
  const chars = useMemo(() => Array.from(text), [text]);
  const [selected, setSelected] = useState([]);
  const styles = normalizeChars(text, d.chars);
  const selectedIndexes = selected.filter((i) => i >= 0 && i < chars.length);
  const activeIndexes = selectedIndexes.length ? selectedIndexes : (chars.length ? [0] : []);
  const first = activeIndexes[0] ?? 0;
  const current = styles[first] || {};

  function updateText(nextText) {
    const nextChars = normalizeChars(nextText, d.chars);
    const max = Array.from(nextText).length - 1;
    setSelected((prev) => prev.filter((i) => i <= max));
    onChange({ ...d, text: nextText, chars: nextChars });
  }

  function updateBase(patch) {
    onChange({ ...d, ...patch, chars: styles });
  }

  function updateSelected(patch) {
    const targets = activeIndexes.length ? activeIndexes : [];
    const next = styles.map((item, i) => targets.includes(i) ? { ...item, ...patch } : item);
    onChange({ ...d, chars: next });
  }

  function toggleIndex(index) {
    setSelected((prev) => prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b));
  }

  function selectAll() {
    setSelected(chars.map((_, i) => i));
  }

  function clearSelection() {
    setSelected([]);
  }

  function clearSelectedStyle() {
    const targets = activeIndexes.length ? activeIndexes : [];
    const next = styles.map((item, i) => targets.includes(i) ? {} : item);
    onChange({ ...d, chars: next });
  }

  function applyBaseToAll() {
    const next = styles.map(() => ({ font: d.font || 'Inter', size: d.size || 16, color: d.color || '#111111' }));
    onChange({ ...d, chars: next });
    selectAll();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        <button type="button" onClick={applyBaseToAll} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">基础样式应用到每个字</button>
      </div>

      <label className="mb-1 block text-xs font-medium text-gray-500">文字内容</label>
      <textarea value={text} onChange={(e) => updateText(e.target.value)} rows={text.length > 34 ? 3 : 1} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_80px_130px]">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">默认字体</label>
          <FontSelect value={d.font || 'Inter'} onChange={(font) => updateBase({ font })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">默认字号</label>
          <input type="number" value={d.size || 16} onChange={(e) => updateBase({ size: parseInt(e.target.value, 10) || 16 })} className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">默认颜色</label>
          <div className="flex gap-1">
            <input type="color" value={d.color || '#111111'} onChange={(e) => updateBase({ color: e.target.value })} className="h-9 w-9 rounded border-0 p-0" />
            <input value={d.color || '#111111'} onChange={(e) => updateBase({ color: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-xs font-mono outline-none" />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-gray-500">选择要批量修改的字，可多选</p>
          <div className="flex gap-2">
            <button type="button" onClick={selectAll} className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100">全选</button>
            <button type="button" onClick={clearSelection} className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100">取消选择</button>
          </div>
        </div>
        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-auto">
          {chars.map((char, i) => {
            const isSelected = selectedIndexes.includes(i);
            return (
              <button key={`${char}-${i}`} type="button" onClick={() => toggleIndex(i)} className={`h-8 min-w-8 rounded-lg border px-2 text-sm transition ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200'}`} title={`第 ${i + 1} 个字`}>
                {char === ' ' ? '空格' : char}
              </button>
            );
          })}
          {!chars.length && <span className="text-xs text-gray-400">先输入文字</span>}
        </div>
      </div>

      {!!chars.length && (
        <div className="mt-4 rounded-lg border border-orange-100 bg-orange-50/40 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-800">正在批量修改：{activeIndexes.length} 个字</p>
            <button type="button" onClick={clearSelectedStyle} className="text-xs font-medium text-gray-500 hover:text-red-600">清除所选字样式</button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_80px_130px]">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">字体</label>
              <FontSelect value={current.font || d.font || 'Inter'} onChange={(font) => updateSelected({ font })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">字号</label>
              <input type="number" value={current.size || d.size || 16} onChange={(e) => updateSelected({ size: parseInt(e.target.value, 10) || 16 })} className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">颜色</label>
              <div className="flex gap-1">
                <input type="color" value={current.color || d.color || '#111111'} onChange={(e) => updateSelected({ color: e.target.value })} className="h-9 w-9 rounded border-0 p-0" />
                <input value={current.color || d.color || '#111111'} onChange={(e) => updateSelected({ color: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-xs font-mono outline-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
        <p className="mb-2 text-xs font-medium text-gray-400">预览</p>
        <p style={{ fontFamily: `"${d.font || 'Inter'}"`, fontSize: `${d.size || 16}px`, color: d.color || '#111111' }}>
          {chars.map((char, i) => {
            const cs = styles[i] || {};
            return <span key={`${char}-preview-${i}`} style={{ ...(cs.font ? { fontFamily: `"${cs.font}"` } : {}), ...(cs.size ? { fontSize: `${cs.size}px` } : {}), ...(cs.color ? { color: cs.color } : {}) }}>{char}</span>;
          })}
        </p>
      </div>
    </div>
  );
}

function AboutImageUpload({ theme, onTheme, pushHistory }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function upload() {
    if (!file) return setMessage('请先选择图片');
    setBusy(true);
    setMessage('');
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/theme/about-image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: fd,
    });
    const data = await res.json();
    if (res.ok) {
      pushHistory?.();
      onTheme(data);
      setFile(null);
      setMessage('关于我图片已上传');
    } else {
      setMessage(data.error || '上传失败');
    }
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4">
      <h3 className="text-sm font-semibold text-gray-800">关于我图片</h3>
      <p className="mt-1 text-xs text-gray-500">上传后显示在首页“关于我”左侧。</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="h-28 w-24 overflow-hidden rounded-lg bg-white ring-1 ring-gray-200">
          {theme?.aboutImage ? <img src={theme.aboutImage} alt="关于我图片预览" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">暂无图片</div>}
        </div>
        <div className="flex-1">
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
          <button type="button" disabled={busy} onClick={upload} className="mt-3 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? '上传中...' : '上传关于我图片'}</button>
          {message && <p className="mt-2 text-xs text-gray-500">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default function SiteEditor() {
  const [theme, setTheme] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('hero');

  useEffect(() => {
    fetch('/api/theme').then((r) => r.json()).then((data) => { setTheme(data); setLoading(false); });
  }, []);

  function pushHistory(snapshot = theme) {
    if (!snapshot) return;
    setHistory((prev) => {
      const next = prev.length && sameTheme(prev[prev.length - 1], snapshot) ? prev : [...prev, snapshot];
      return next.slice(-30);
    });
  }

  function update(key, value) {
    setTheme((prev) => {
      pushHistory(prev);
      return { ...prev, [key]: value };
    });
  }

  function undo() {
    setHistory((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setTheme(last);
      return prev.slice(0, -1);
    });
  }

  async function resetDefaults() {
    if (!window.confirm('确定恢复默认设置吗？当前未保存的文字样式会被默认值覆盖。')) return;
    pushHistory();
    const res = await fetch('/api/theme/reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (res.ok) {
      setTheme(await res.json());
    } else {
      alert('恢复默认失败');
    }
  }

  async function save() {
    const res = await fetch('/api/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(theme),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      alert('保存失败');
    }
  }

  function field(key, label) {
    return <RichFieldEditor key={key} label={label} data={theme?.[key]} onChange={(next) => update(key, next)} />;
  }

  const tabs = [
    { k: 'hero', l: 'Hero 区' },
    { k: 'works', l: '作品区' },
    { k: 'about', l: '关于我' },
    { k: 'contact', l: '联系我' },
    { k: 'global', l: '全局' },
  ];

  if (loading) return <div className="py-20 text-center text-gray-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="h-16 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-black text-gray-900 no-underline" style={{ fontFamily: "'Playfair Display', serif" }}>CCY<span className="text-orange-500">.</span>SPACE</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="rounded-full border border-gray-200 px-4 py-2 text-gray-500 no-underline hover:bg-gray-50">← 返回首页</Link>
            <Link to="/admin" className="rounded-full bg-orange-500 px-5 py-2 font-bold text-white no-underline">⚙ 管理后台</Link>
            <button type="button" className="text-gray-300">退出</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">网站设置</h1>
          <p className="mt-1 text-sm text-gray-400">每个字都可以单独或批量修改字体、字号和颜色</p>
        </div>

        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {tabs.map((item) => (
            <button key={item.k} onClick={() => setTab(item.k)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === item.k ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{item.l}</button>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={undo} disabled={!history.length} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50">↶ 撤回上一步</button>
          <button type="button" onClick={resetDefaults} className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100">恢复默认设置</button>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {tab === 'hero' && (
            <>
              {field('heroTag', 'Hero 标签')}
              {field('heroTitle', 'Hero 大标题')}
              {field('heroSubtitle', 'Hero 副标题')}
              {field('heroBtn1', '按钮 1')}
              {field('heroBtn2', '按钮 2')}
            </>
          )}
          {tab === 'works' && (
            <>
              {field('worksTitle', '作品区标题')}
              {field('worksSubtitle', '作品区副标题')}
              {field('worksEmpty', '空状态文字')}
            </>
          )}
          {tab === 'about' && (
            <>
              <AboutImageUpload theme={theme} onTheme={setTheme} pushHistory={pushHistory} />
              {field('aboutTitle', '关于我标题')}
              {field('aboutHeadline', '关于我口号')}
              {field('aboutBio1', '简介 1')}
              {field('aboutBio2', '简介 2')}
              {field('aboutBio3', '简介 3')}
            </>
          )}
          {tab === 'contact' && (
            <>
              {field('contactTitle', '联系区标题')}
              {field('contactSubtitle', '联系区副标题')}
              {field('contactEmail', '邮箱')}
              {field('contactLocation', '位置')}
              {field('contactBtnText', '按钮文字')}
            </>
          )}
          {tab === 'global' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <label className="mb-2 block text-sm font-semibold text-gray-700">强调色</label>
                <div className="flex gap-2">
                  <input type="color" value={theme?.accentColor || '#ff6600'} onChange={(e) => update('accentColor', e.target.value)} className="h-10 w-10 rounded border-0 p-0" />
                  <input value={theme?.accentColor || '#ff6600'} onChange={(e) => update('accentColor', e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm" />
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <label className="mb-2 block text-sm font-semibold text-gray-700">主色调</label>
                <div className="flex gap-2">
                  <input type="color" value={theme?.primaryColor || '#3b82f6'} onChange={(e) => update('primaryColor', e.target.value)} className="h-10 w-10 rounded border-0 p-0" />
                  <input value={theme?.primaryColor || '#3b82f6'} onChange={(e) => update('primaryColor', e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm" />
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-4 flex justify-end border-t border-gray-100 bg-white/90 pt-4 backdrop-blur">
            <button onClick={save} className={`rounded-lg px-8 py-3 text-sm font-semibold text-white shadow-sm transition ${saved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>{saved ? '已保存' : '保存全部'}</button>
          </div>
        </div>
      </main>
    </div>
  );
}
