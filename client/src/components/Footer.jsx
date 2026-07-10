import { RichText, useTheme } from '../context/ThemeContext';

export default function Footer() {
  const t = useTheme();
  const acc = t?.accentColor || '#ff6600';

  return (
    <footer className="px-6 py-14 text-center md:px-20" style={{ background: '#09071d' }}>
      <div className="mx-auto max-w-4xl">
        <p className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>CCY<span style={{ color: acc }}>.</span>SPACE</p>
        <RichText as="p" value={t?.footerTagline} fallback="ccyspace.icu — 创意空间" className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.38)' }} />
        <div className="mt-8 flex items-center justify-center gap-8">
          {['hero', 'work', 'about', 'contact'].map((id, i) => {
            const key = `nav${['Home', 'Work', 'About', 'Contact'][i]}`;
            return (
              <a key={id} href={`#${id}`} className="text-sm no-underline transition-opacity hover:opacity-70" style={{ color: 'rgba(255,255,255,0.42)' }}>
                <RichText value={t?.[key]} fallback={['首页', '作品', '关于', '联系'][i]} />
              </a>
            );
          })}
        </div>
        <RichText as="p" value={t?.footerCopyright} fallback="© 2026 CCY SPACE. All rights reserved." className="mt-9 text-xs" style={{ color: 'rgba(255,255,255,0.28)' }} />
      </div>
    </footer>
  );
}
