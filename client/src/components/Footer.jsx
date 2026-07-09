import { useTheme, txt } from '../context/ThemeContext';

export default function Footer() {
  const t = useTheme();
  const acc = t?.accentColor || '#ff6600';

  return (
    <footer className="py-12 px-8 md:px-20 relative" style={{ background: '#08080c' }}>
      {/* Top gradient line */}
      <div className="h-px mb-10" style={{ background: `linear-gradient(90deg, transparent, ${acc}20, rgba(255,255,255,0.06), ${acc}20, transparent)` }} />
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          {txt(t?.footerTitle, 'CCY.SPACE')}
        </p>
        <div className="flex items-center gap-8">
          {['hero', 'work', 'about', 'contact'].map((id, i) => (
            <a key={id} href={'#' + id}
              className="text-xs tracking-[0.1em] transition-all duration-300 hover:text-white/60"
              style={{ color: 'rgba(255,255,255,0.22)' }}>
              {txt(t?.['nav' + ['Home', 'Work', 'About', 'Contact'][i]], ['首页', '作品', '关于', '联系'][i])}
            </a>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.12)' }}>
          {txt(t?.footerCopyright, '© 2026 CCY SPACE')}
        </p>
      </div>
    </footer>
  );
}
