import { useState, useEffect } from 'react';
import { useTheme, txt } from '../context/ThemeContext';

export default function Contact() {
  const t = useTheme();
  const [resume, setResume] = useState(null);
  const acc = t?.accentColor || '#ff6600';
  const email = txt(t?.contactEmail, 'ccy@ccyspace.icu');

  useEffect(() => {
    fetch('/api/contact/resume').then(r => r.json()).then(d => { if (d?.url) setResume(d); }).catch(() => {});
  }, []);

  return (
    <section id="contact" className="relative py-36 px-8 md:px-20" style={{ background: '#08080c' }}>
      <div className="max-w-7xl mx-auto">
        {/* 03 Contact */}
        <div className="flex items-center gap-4 mb-20">
          <span className="text-xs font-semibold tracking-[0.25em]" style={{ color: acc }}>03</span>
          <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-[11px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Contact</span>
        </div>

        <div className="grid md:grid-cols-2 gap-20">
          {/* LEFT: Heading */}
          <div>
            <h2 className="font-black leading-none text-white"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 64px)' }}>
              {txt(t?.contactTitle, 'Get in')}<br />
              <span style={{ color: acc }}>Touch</span>
            </h2>
            <p className="text-sm mt-6" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {txt(t?.contactSubtitle, '合作联系')}
            </p>
          </div>

          {/* RIGHT: Contact details */}
          <div className="space-y-14">
            {/* Email */}
            <div className="group">
              <p className="text-[10px] tracking-[0.3em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.18)' }}>Email</p>
              <a href={'mailto:' + email}
                className="text-2xl md:text-[28px] font-semibold text-white no-underline transition-all duration-300 group-hover:opacity-60"
                style={{ wordBreak: 'break-all' }}>
                {email}
                <span className="inline-block ml-3 text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-8px] group-hover:translate-x-0" style={{ color: acc }}>↗</span>
              </a>
            </div>

            {/* Location */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.18)' }}>Location</p>
              <p className="text-2xl md:text-[28px] font-semibold text-white">
                {txt(t?.contactLocation, '中国 · 在线')}
              </p>
            </div>

            {/* Resume */}
            {resume && (
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.18)' }}>Resume</p>
                <a href={'https://portfolio-production-913f.up.railway.app' + resume.url}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base font-semibold text-white no-underline transition-all duration-300 hover:opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: acc }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {resume.name}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            )}

            {/* Send button */}
            <a href={'mailto:' + email}
              className="mt-8 inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-semibold text-white no-underline transition-all duration-500 hover:scale-105 relative overflow-hidden group"
              style={{ background: acc }}>
              <span className="relative z-10">{txt(t?.contactBtnText, '发送邮件')}</span>
              <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)` }} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
