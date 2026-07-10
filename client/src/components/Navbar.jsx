import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RichText, useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const home = pathname === '/';
  const t = useTheme();
  const acc = t?.accentColor || '#ff6600';

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      if (!home) return;
      for (const id of ['contact', 'about', 'work', 'hero']) {
        const el = document.getElementById(id);
        if (el?.getBoundingClientRect().top <= 90) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [home]);

  const to = (id) => {
    if (!home) {
      window.location.href = `/#${id}`;
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navs = [
    { id: 'hero', key: 'navHome', fallback: '首页' },
    { id: 'work', key: 'navWork', fallback: '作品' },
    { id: 'about', key: 'navAbout', fallback: '关于' },
    { id: 'contact', key: 'navContact', fallback: '联系' },
  ];
  const heroMode = home && activeSection === 'hero' && !scrolled;
  const fg = heroMode ? '#fff' : '#374151';
  const muted = heroMode ? 'rgba(255,255,255,0.68)' : '#6b7280';

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 h-16 transition-all" style={{ background: heroMode ? 'transparent' : 'rgba(255,255,255,0.96)', borderBottom: heroMode ? 'none' : '1px solid #eef0f4', boxShadow: heroMode ? 'none' : '0 4px 18px rgba(17,24,39,0.04)', backdropFilter: heroMode ? 'none' : 'blur(12px)' }}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <a href="#hero" onClick={(e) => { e.preventDefault(); to('hero'); }} className="text-xl font-black no-underline" style={{ color: fg, fontFamily: "'Playfair Display', serif" }}>CCY<span style={{ color: acc }}>.</span>SPACE</a>
        <div className="hidden items-center gap-7 md:flex">
          {home && navs.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); to(n.id); }} className="text-sm font-semibold no-underline transition-opacity hover:opacity-70" style={{ color: activeSection === n.id ? fg : muted }}>
              <RichText value={t?.[n.key]} fallback={n.fallback} />
            </a>
          ))}
          {user ? (
            <>
              <Link to="/admin" className="rounded-full px-5 py-2 text-sm font-bold text-white no-underline" style={{ background: acc }}>⚙ 管理后台</Link>
              <span className="text-sm" style={{ color: muted }}>退出</span>
            </>
          ) : (
            <Link to="/login" className="text-sm font-semibold no-underline" style={{ color: muted }}>登录</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
