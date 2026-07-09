import { useState, useEffect } from 'react';

const FONTS = ['Playfair Display','Inter','Noto Sans SC','PingFang SC','Microsoft YaHei','SimHei','KaiTi','Arial','Georgia'];

function FontRow({ value, onChange }) {
  const isCustom = value && !FONTS.includes(value);
  const cls = "px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500";
  return (
    <div className="flex gap-0">
      <select value={isCustom ? '__custom__' : (value || 'Inter')}
        onChange={e => { if (e.target.value === '__custom__') return; onChange(e.target.value); }}
        className={`${cls} border border-gray-200 rounded-l w-1/2`}>
        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        <option value="__custom__">💻 自定义...</option>
      </select>
      <input value={isCustom ? value : ''} onChange={e => onChange(e.target.value || 'Inter')}
        placeholder="输入字体" className={`${cls} border border-l-0 border-gray-200 rounded-r w-1/2`} />
    </div>
  );
}

function Elem({ label, data, onChange }) {
  const d = data || {};
  const inp = "w-full px-2 py-1.5 rounded border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
      <p className="text-xs font-semibold text-gray-700">{label}</p>
      <input value={d.text||''} onChange={e=>onChange({...d,text:e.target.value})} className={inp} placeholder="文字内容" />
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-[10px] text-gray-400 block mb-0.5">字体</span>
          <FontRow value={d.font||'Inter'} onChange={v => onChange({...d,font:v})} />
        </div>
        <div className="w-16">
          <span className="text-[10px] text-gray-400 block mb-0.5">字号</span>
          <input type="number" value={d.size||16} onChange={e=>onChange({...d,size:parseInt(e.target.value)||16})} className={inp} />
        </div>
        <div className="w-20">
          <span className="text-[10px] text-gray-400 block mb-0.5">颜色</span>
          <div className="flex items-center gap-1">
            <input type="color" value={d.color||'#000'} onChange={e=>onChange({...d,color:e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0 flex-shrink-0" />
            <input value={d.color||'#000'} onChange={e=>onChange({...d,color:e.target.value})} className={`${inp} font-mono flex-1`} />
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={()=>onChange({...d,bold:!d.bold})}
          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${d.bold?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>B</button>
        <button type="button" onClick={()=>onChange({...d,italic:!d.italic})}
          className={`px-3 py-1 rounded text-xs italic transition-colors ${d.italic?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>I</button>
        <button type="button" onClick={()=>onChange({...d,underline:!d.underline})}
          className={`px-3 py-1 rounded text-xs transition-colors ${d.underline?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
          style={d.underline?{}:{textDecoration:'underline'}}>U</button>
      </div>
    </div>
  );
}

function Sec({title,fields}){return<div className="space-y-2"><h3 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">{title}</h3>{fields.map(f=><Elem key={f.k} label={f.l} data={f.d} onChange={f.on}/>)}</div>}

export default function SiteEditor(){
  const [t,s]=useState(null);const [l,sl]=useState(true);const [sv,ssv]=useState(false);const [tab,st]=useState('hero');
  useEffect(()=>{fetch('/api/theme').then(r=>r.json()).then(d=>{s(d);sl(false)})},[]);
  async function save(){
    const tk=localStorage.getItem('token');
    const res=await fetch('/api/theme',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify(t)});
    if(res.ok){ssv(true);setTimeout(()=>ssv(false),3000);}else alert('保存失败');
  }
  function U(k,v){s(p=>({...p,[k]:v}));}
  function F(k){return{k:k,l:k,d:t?.[k],on:nv=>U(k,nv)};}

  const tabs=[{k:'hero',l:'🏠 Hero 区'},{k:'works',l:'🎴 作品区'},{k:'about',l:'👤 关于我'},{k:'contact',l:'📧 联系我'},{k:'global',l:'🎨 全局'}];
  if(l)return<div className="text-center py-20 text-gray-400">加载中...</div>;

  return(
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-gray-800">⚙️ 网站设置</h1><p className="text-sm text-gray-400">每个元素独立修改文字和字体样式</p></div>
        <button onClick={save} className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all ${sv?'bg-green-500':'bg-blue-600 hover:bg-blue-700'}`}>{sv?'✅ 已保存':'💾 保存全部'}</button>
      </div>
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(tb=>(<button key={tb.k} onClick={()=>st(tb.k)} className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${tab===tb.k?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>{tb.l}</button>))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-3">
        {tab==='hero'&&<Sec title="Hero 大屏" fields={[{...F('heroTag'),l:'标签'},{...F('heroTitle'),l:'大标题'},{...F('heroSubtitle'),l:'副标题'},{...F('heroBtn1'),l:'按钮1'},{...F('heroBtn2'),l:'按钮2'}]}/>}
        {tab==='works'&&<Sec title="作品区" fields={[{...F('worksTitle'),l:'标题'},{...F('worksSubtitle'),l:'副标题'},{...F('worksEmpty'),l:'空状态文字'}]}/>}
        {tab==='about'&&<Sec title="关于我" fields={[{...F('aboutTitle'),l:'标题'},{...F('aboutHeadline'),l:'口号'},{...F('aboutBio1'),l:'简介1'},{...F('aboutBio2'),l:'简介2'},{...F('aboutBio3'),l:'简介3'}]}/>}
        {tab==='contact'&&<Sec title="联系我" fields={[{...F('contactTitle'),l:'标题'},{...F('contactSubtitle'),l:'副标题'},{...F('contactEmail'),l:'邮箱'},{...F('contactLocation'),l:'位置'},{...F('contactBtnText'),l:'按钮'}]}/>}
        {tab==='global'&&<div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-gray-600 mb-1 block">强调色</label><div className="flex items-center gap-1"><input type="color" value={t?.accentColor||'#ff6600'} onChange={e=>U('accentColor',e.target.value)} className="w-7 h-7 rounded border-0 p-0 cursor-pointer"/><input value={t?.accentColor||'#ff6600'} onChange={e=>U('accentColor',e.target.value)} className="w-28 px-2 py-1 rounded border border-gray-200 text-xs font-mono bg-white"/></div></div><div><label className="text-xs font-medium text-gray-600 mb-1 block">主色调</label><div className="flex items-center gap-1"><input type="color" value={t?.primaryColor||'#3b82f6'} onChange={e=>U('primaryColor',e.target.value)} className="w-7 h-7 rounded border-0 p-0 cursor-pointer"/><input value={t?.primaryColor||'#3b82f6'} onChange={e=>U('primaryColor',e.target.value)} className="w-28 px-2 py-1 rounded border border-gray-200 text-xs font-mono bg-white"/></div></div></div>}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button onClick={save} className={`px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${sv?'bg-green-500':'bg-blue-600 hover:bg-blue-700'}`}>{sv?'✅ 已保存':'💾 保存全部'}</button>
        </div>
      </div>
    </div>
  );
}
