import { useTheme, txt } from '../context/ThemeContext';

const TAGS = ['视频剪辑', '摄影摄像', '平面设计', '文案策划', '后期制作', '品牌策划', '影视特效', '平面设计'];

export default function About() {
  const t = useTheme();
  const acc = t?.accentColor || '#ff6600';

  return (
    <section id="about" className="relative py-36 px-8 md:px-20 overflow-hidden" style={{ background: '#08080c' }}>

      {/* Giant faint ABOUT watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span style={{
          fontSize: 'clamp(140px, 18vw, 320px)',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.015)',
          fontFamily: "'Playfair Display', serif",
          whiteSpace: 'nowrap',
          letterSpacing: '-0.02em',
        }}>ABOUT</span>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* 02 About Me */}
        <div className="flex items-center gap-4 mb-20">
          <span className="text-xs font-semibold tracking-[0.25em]" style={{ color: acc }}>02</span>
          <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-[11px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>About Me</span>
        </div>

        <div className="grid md:grid-cols-[380px_1fr] gap-20 items-center">
          {/* LEFT: Portrait photo */}
          <div>
            <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden relative group"
              style={{ background: '#0d0d15', border: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Decorative gradient */}
              <div className="absolute inset-0 opacity-30"
                style={{ background: `linear-gradient(135deg, ${acc}10 0%, transparent 50%, #667eea10 100%)` }} />
              <div className="w-full h-full flex items-center justify-center relative">
                <div className="text-center">
                  <span className="text-5xl font-black select-none block mb-2" style={{ color: 'rgba(255,255,255,0.03)', fontFamily: "'Playfair Display', serif" }}>CCY</span>
                  <div className="w-12 h-px mx-auto rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${acc}30, transparent)` }} />
                </div>
              </div>
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                style={{ background: `radial-gradient(circle at 100% 0%, ${acc}15 0%, transparent 70%)` }} />
            </div>
          </div>

          {/* RIGHT: Text */}
          <div>
            <h2 className="font-black leading-tight mb-10 text-white"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)' }}>
              {txt(t?.aboutHeadline, '创意驱动')}<br />{txt(t?.aboutTitle, '无限进步')}
            </h2>

            <div className="space-y-5 mb-12 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.8 }}>
              <p>{txt(t?.aboutBio1, '你好！我是 CCY，一个热爱创作的内容创作者。')}</p>
              <p>{txt(t?.aboutBio2, '我相信每一个瞬间都值得被记录，每一个想法都值得被分享。从视频到图片到文章，我用不同媒介表达创意、讲述故事。')}</p>
              <p>{txt(t?.aboutBio3, '欢迎随时联系我，一起碰撞创意火花！')}</p>
            </div>

            {/* Tags — outlined only with hover effect */}
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <span key={tag} className="px-5 py-2.5 rounded-full text-xs font-medium cursor-default transition-all duration-300 hover:border-white/25 hover:text-white/60"
                  style={{ color: 'rgba(255,255,255,0.45)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
