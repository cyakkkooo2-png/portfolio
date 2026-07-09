import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, txt } from '../context/ThemeContext';

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
      setScrolled(window.scrollY > 60);
      if (!home) return;
      const sections = ['hero', 'work', 'about', 'contact'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el?.getBoundingClientRect().top <= window.innerHeight / 3) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [home]);

  const to = (id) => {
    if (!home) { window.location.href = '/#' + id; return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navs = [
    { id: 'hero', key: 'navHome', def: '首页', num: '01' },
    { id: 'work', key: 'navWork', def: '作品', num: '02' },
    { id: 'about', key: 'navAbout', def: '关于', num: '03' },
    { id: 'contact', key: 'navContact', def: '联系', num: '04' },
  ];

  const transparent = home && !scrolled;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: transparent ? 'transparent' : 'rgba(8,8,12,0.92)',
        backdropFilter: transparent ? 'none' : 'blur(20px)',
        borderBottom: transparent ? 'none' : '1px solid rgba(255,255,255,0.05)',
        boxShadow: transparent ? 'none' : '0 1px 20px rgba(0,0,0,0.3)',
      }}>
      <div className="max-w-7xl mx-auto px-8 md:px-20 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" onClick={e => { e.preventDefault(); to('hero'); }}
          className="text-lg font-bold no-underline text-white transition-opacity duration-300 hover:opacity-80"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          CCY<span style={{ color: acc }}>.</span>SPACE
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {home && navs.map(n => (
            <a key={n.id} href={'#' + n.id} onClick={e => { e.preventDefault(); to(n.id); }}
              className="text-xs tracking-[0.15em] font-medium transition-all duration-300 relative py-1"
              style={{ color: activeSection === n.id ? '#fff' : 'rgba(255,255,255,0.28)' }}>
              <span style={{ color: activeSection === n.id ? acc : 'rgba(255,255,255,0.1)' }}>{n.num}</span>
              <span className="ml-1.5">{txt(t?.[n.key], n.def)}</span>
              {/* Active indicator dot */}
              {activeSection === n.id && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: acc }} />
              )}
            </a>
          ))}
          <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
          {user ? (
            <Link to="/admin" className="text-xs tracking-[0.15em] font-medium transition-all hover:opacity-70" style={{ color: acc }}>管理</Link>
          ) : (
            <Link to="/login" className="text-xs tracking-[0.15em] font-medium transition-all hover:text-white/50" style={{ color: 'rgba(255,255,255,0.28)' }}>登录</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
