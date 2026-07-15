import { RichText, useTheme } from '../context/ThemeContext';

const DISPLAY_TITLE_FONT = "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', SimSun, serif";

function ChipIcon({ type, color }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'video') return <svg {...common}><path d="M5 7.5h9.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" /><path d="m16.5 10 4-2.2v8.4l-4-2.2" /><path d="M7 11h3" /></svg>;
  if (type === 'image') return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="m4 15 4.2-4.2a1.5 1.5 0 0 1 2.1 0L15 15.5" /><path d="m13 14 1.5-1.5a1.5 1.5 0 0 1 2.1 0L20 16" /><circle cx="15.5" cy="9.5" r="1.2" /></svg>;
  if (type === 'article') return <svg {...common}><path d="M7 3.5h7l3 3V20a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" /><path d="M14 3.5V7h3" /><path d="M9 12h6" /><path d="M9 15.5h5" /></svg>;
  return <svg {...common}><path d="M12 2.8 13.8 8 19 9.8 13.8 11.6 12 16.8 10.2 11.6 5 9.8 10.2 8 12 2.8Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>;
}

export default function Hero() {
  const t = useTheme();
  const acc = t?.accentColor || '#ff6600';
  const to = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const chips = [
    { type: 'video', label: '视频' },
    { type: 'image', label: '图片' },
    { type: 'article', label: '文章' },
    { type: 'spark', label: 'AI 创作' },
  ];

  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6" style={{ background: 'radial-gradient(circle at 8% 18%, #25215d 0%, #1d1948 32%, #19163d 60%, #33204f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 28%, rgba(255,255,255,0.02))' }} />

      <div className="relative z-10 mx-auto max-w-4xl text-center" style={{ marginTop: 70 }}>
        <RichText
          value={t?.heroTag}
          fallback="Creative Space · 2026"
          className="inline-flex items-center rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'rgba(255,255,255,0.66)', borderColor: 'rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.035)' }}
        />

        <RichText
          as="h1"
          value={t?.heroTitle}
          fallback="创意.空间"
          className="mt-8 text-white"
          forceFontFamily={DISPLAY_TITLE_FONT}
          style={{ fontFamily: DISPLAY_TITLE_FONT, fontSize: 'clamp(56px, 6vw, 86px)', fontWeight: 900, lineHeight: 1.05 }}
        />

        <RichText
          as="p"
          value={t?.heroSubtitle}
          fallback="用镜头捕捉瞬间，用文字记录思考。这里是视频、影像与文字的创意集合。"
          className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.56)' }}
        />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => to('work')} className="rounded-full px-9 py-3 text-sm font-bold text-white transition-transform hover:scale-105" style={{ background: acc, boxShadow: `0 14px 35px ${acc}33` }}>
            <RichText value={t?.heroBtn1} fallback="查看作品" />
          </button>
          <button onClick={() => to('contact')} className="rounded-full border px-9 py-3 text-sm font-bold text-white transition-transform hover:scale-105" style={{ borderColor: 'rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.035)' }}>
            <RichText value={t?.heroBtn2} fallback="联系我" />
          </button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {chips.map((item) => (
            <span key={item.type} className="inline-flex items-center gap-2.5 rounded-full border px-5 py-2 text-sm font-medium shadow-sm" style={{ color: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.055))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}>
              <ChipIcon type={item.type} color={item.type === 'spark' ? '#f6b26b' : acc} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        <div>向下滚动</div>
        <div className="mx-auto mt-2 h-8 w-4 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.18)' }} />
      </div>
    </section>
  );
}
