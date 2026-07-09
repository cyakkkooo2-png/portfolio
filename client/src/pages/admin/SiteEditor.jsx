import { useState, useEffect } from 'react';

const FONTS = ['Playfair Display','Inter','Noto Sans SC','PingFang SC','Microsoft YaHei','SimHei','KaiTi','Arial','Georgia'];

function FontRow({ value, onChange }) {
  const isCustom = value && !FONTS.includes(value);
  const cls = "px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500";
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
  const inp = "w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
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
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${d.bold?'bg-indigo-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>B</button>
        <button type="button" onClick={()=>onChange({...d,italic:!d.italic})}
          className={`px-3 py-1 rounded-lg text-xs italic transition-colors ${d.italic?'bg-indigo-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>I</button>
        <button type="button" onClick={()=>onChange({...d,underline:!d.underline})}
          className={`px-3 py-1 rounded-lg text-xs transition-colors ${d.underline?'bg-indigo-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
          style={d.underline?{}:{textDecoration:'underline'}}>U</button>
      </div>
    </div>
  );
}

function Sec({title,fields}){return<div className="space-y-2"><h3 className="text-sm font-semibold text-gray-700 pb-2">{title}</h3>{fields.map(f=><Elem key={f.k} label={f.l} data={f.d} onChange={f.on}/>)}</div>}

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

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2f5' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col py-5" style={{ background: '#16162a' }}>
        <div className="px-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>C</div>
            <div><p className="text-sm font-semibold text-white leading-tight">CCY SPACE</p><p className="text-[10px] text-gray-500 leading-tight">管理后台</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          <a href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 no-underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>概览
          </a>
          <a href="/admin/upload" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 no-underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>上传
          </a>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-300 no-underline" style={{ background: 'rgba(99,102,241,0.25)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>设置
          </div>
        </nav>
        <div className="px-3 mt-auto pt-4 border-t border-white/5">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 no-underline">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>返回首页
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto admin-scroll">
        <header className="h-16 flex items-center px-8 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-900">⚙️ 网站设置</h1>
        </header>
        {l ? <div className="text-center py-20 text-gray-400">加载中...</div> : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-400">每个元素独立修改文字和字体样式</p>
              <button onClick={save} className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all ${sv?'bg-emerald-500':'bg-indigo-600 hover:bg-indigo-700'}`}
                style={!sv?{background:'linear-gradient(135deg, #6366f1, #8b5cf6)'}:{}}>
                {sv?'✅ 已保存':'💾 保存全部'}
              </button>
            </div>
            <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
              {tabs.map(tb=>(
                <button key={tb.k} onClick={()=>st(tb.k)}
                  className={`flex-shrink-0 py-2 px-4 rounded-xl text-xs font-medium transition-all ${tab===tb.k?'text-white':'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'}`}
                  style={tab===tb.k?{background:'linear-gradient(135deg, #6366f1, #8b5cf6)'}:{}}>
                  {tb.l}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              {tab==='hero'&&<Sec title="Hero 大屏" fields={[{...F('heroTag'),l:'标签'},{...F('heroTitle'),l:'大标题'},{...F('heroSubtitle'),l:'副标题'},{...F('heroBtn1'),l:'按钮1'},{...F('heroBtn2'),l:'按钮2'}]}/>}
              {tab==='works'&&<Sec title="作品区" fields={[{...F('worksTitle'),l:'标题'},{...F('worksSubtitle'),l:'副标题'},{...F('worksEmpty'),l:'空状态文字'}]}/>}
              {tab==='about'&&<Sec title="关于我" fields={[{...F('aboutTitle'),l:'标题'},{...F('aboutHeadline'),l:'口号'},{...F('aboutBio1'),l:'简介1'},{...F('aboutBio2'),l:'简介2'},{...F('aboutBio3'),l:'简介3'}]}/>}
              {tab==='contact'&&<Sec title="联系我" fields={[{...F('contactTitle'),l:'标题'},{...F('contactSubtitle'),l:'副标题'},{...F('contactEmail'),l:'邮箱'},{...F('contactLocation'),l:'位置'},{...F('contactBtnText'),l:'按钮'}]}/>}
              {tab==='global'&&<div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-semibold text-gray-600 mb-1.5 block">强调色</label><div className="flex items-center gap-1"><input type="color" value={t?.accentColor||'#ff6600'} onChange={e=>U('accentColor',e.target.value)} className="w-8 h-8 rounded-lg border-0 p-0 cursor-pointer"/><input value={t?.accentColor||'#ff6600'} onChange={e=>U('accentColor',e.target.value)} className="w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono bg-white"/></div></div><div><label className="text-xs font-semibold text-gray-600 mb-1.5 block">主色调</label><div className="flex items-center gap-1"><input type="color" value={t?.primaryColor||'#3b82f6'} onChange={e=>U('primaryColor',e.target.value)} className="w-8 h-8 rounded-lg border-0 p-0 cursor-pointer"/><input value={t?.primaryColor||'#3b82f6'} onChange={e=>U('primaryColor',e.target.value)} className="w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono bg-white"/></div></div></div>}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button onClick={save} className={`px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${sv?'bg-emerald-500':'bg-indigo-600 hover:bg-indigo-700'}`}
                  style={!sv?{background:'linear-gradient(135deg, #6366f1, #8b5cf6)'}:{}}>
                  {sv?'✅ 已保存':'💾 保存全部'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
