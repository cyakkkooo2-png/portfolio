import { useTheme, txt } from '../context/ThemeContext';

export default function Hero() {
  const t = useTheme();
  const acc = t?.accentColor || '#ff6600';

  const to = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden" style={{ background: '#08080c' }}>

      {/* ── Ambient gradient orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full opacity-[0.07]"
          style={{
            width: '60vw', height: '60vw', maxWidth: 800, maxHeight: 800,
            background: `radial-gradient(circle, ${acc} 0%, transparent 70%)`,
            top: '-15%', right: '-10%',
            filter: 'blur(80px)',
            animation: 'pulseOrb 8s ease-in-out infinite',
          }} />
        <div className="absolute rounded-full opacity-[0.04]"
          style={{
            width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500,
            background: 'radial-gradient(circle, #667eea 0%, transparent 70%)',
            bottom: '-10%', left: '-5%',
            filter: 'blur(60px)',
            animation: 'pulseOrb 10s ease-in-out infinite alternate',
          }} />
      </div>

      {/* ── Giant ring on the left (partial, goes off screen) ── */}
      <div className="absolute pointer-events-none"
        style={{ left: '-15%', top: '50%', transform: 'translateY(-50%)', width: '50vw', maxWidth: 700 }}>
        <div className="relative w-full" style={{ paddingBottom: '100%' }}>
          <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
          <div className="absolute rounded-full" style={{ inset: '8%', border: '1px solid rgba(255,255,255,0.05)' }} />
          <div className="absolute rounded-full" style={{ inset: '16%', border: '1px solid rgba(255,255,255,0.03)' }} />
          {/* Glowing dot on ring */}
          <div className="absolute rounded-full"
            style={{
              top: '8%', left: '50%', width: 10, height: 10, transform: 'translateX(-50%)',
              background: acc,
              boxShadow: `0 0 20px ${acc}, 0 0 40px ${acc}40, 0 0 80px ${acc}20`,
              animation: 'pulseDot 3s ease-in-out infinite',
            }} />
          {/* Second smaller dot */}
          <div className="absolute rounded-full"
            style={{
              bottom: '20%', right: '15%', width: 6, height: 6,
              background: '#667eea',
              boxShadow: '0 0 15px #667eea, 0 0 30px #667eea40',
              animation: 'pulseDot 4s ease-in-out infinite alternate',
            }} />
        </div>
      </div>

      {/* ── Decorative grid lines (subtle) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-20 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* LEFT: text */}
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-6 animate-in animate-in-delay-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Hello, I'm</p>
            <h1 className="font-black leading-none mb-8 text-white animate-in animate-in-delay-2"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(60px, 8vw, 110px)' }}>
              {txt(t?.heroTitle, 'CCY')}
            </h1>
            <p className="text-base leading-relaxed mb-12 max-w-sm animate-in animate-in-delay-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {txt(t?.heroSubtitle, '用镜头捕捉瞬间，用文字记录思考。')}
            </p>

            <div className="flex items-center gap-4 mb-16">
              <button onClick={() => to('work')}
                className="group px-10 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-500 hover:scale-105 relative overflow-hidden"
                style={{ background: acc }}>
                <span className="relative z-10">{txt(t?.heroBtn1, '查看作品')}</span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)` }} />
              </button>
              <button onClick={() => to('contact')}
                className="px-10 py-3.5 rounded-full text-sm font-semibold transition-all duration-500 hover:scale-105 hover:border-white/30"
                style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.18)' }}>
                {txt(t?.heroBtn2, '联系我')}
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-16 pt-12" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { n: '01', l: '创作类型', v: '视频 / 图片 / 文章' },
                { n: '02', l: '创作经验', v: '3+ 年' },
                { n: '03', l: '项目数量', v: '10+' },
              ].map(s => (
                <div key={s.n}>
                  <span className="text-[11px] font-semibold tracking-[0.2em]" style={{ color: acc }}>{s.n}</span>
                  <p className="text-[11px] mt-2 mb-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{s.l}</p>
                  <p className="text-sm font-semibold text-white">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: circular photo with gradient ring */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute -inset-4 rounded-full opacity-20"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${acc}, transparent, #667eea, transparent)`,
                  filter: 'blur(20px)',
                  animation: 'rotateSlow 12s linear infinite',
                }} />
              {/* Main circle */}
              <div className="relative w-[300px] h-[300px] md:w-[440px] md:h-[440px] rounded-full overflow-hidden"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'radial-gradient(circle at 30% 30%, #1a1a2e 0%, #0d0d15 60%, #08080c 100%)',
                  boxShadow: `0 0 80px ${acc}08, inset 0 0 80px rgba(0,0,0,0.4)`,
                }}>
                {/* Inner decorative rings */}
                <div className="absolute inset-4 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.04)' }} />
                <div className="absolute inset-12 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.02)' }} />
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-0.5 rounded-full mb-4 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${acc}60, transparent)` }} />
                    <span className="text-[13px] tracking-[0.3em] uppercase font-light" style={{ color: 'rgba(255,255,255,0.15)' }}>Creator</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
