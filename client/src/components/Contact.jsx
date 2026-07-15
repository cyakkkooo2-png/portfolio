import { useEffect, useState } from 'react';
import { RichText, fnt, txt, useTheme } from '../context/ThemeContext';

function SplitTitle({ value, fallback }) {
  const text = txt(value, fallback);
  if (value?.chars?.some(Boolean)) return <RichText value={value} fallback={fallback} />;
  if (text.length <= 2) return text;
  return <>{text.slice(0, -2)}<span style={{ color: '#ff6600' }}>{text.slice(-2)}</span></>;
}

export default function Contact() {
  const t = useTheme();
  const [resume, setResume] = useState(null);
  const acc = t?.accentColor || '#ff6600';
  const email = txt(t?.contactEmail, 'ccy@ccyspace.icu');

  useEffect(() => {
    fetch('/api/contact/resume').then((res) => res.json()).then((data) => {
      if (data?.url) setResume(data);
    }).catch(() => {});
  }, []);

  return (
    <section id="contact" className="relative px-6 py-28 md:px-20" style={{ background: '#fff' }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-gray-900" style={{ ...fnt(t?.contactTitle, 'Playfair Display', 48, '#111111'), lineHeight: 1.1 }}>
            <SplitTitle value={t?.contactTitle} fallback="联系合作" />
          </h2>
          <RichText as="p" value={t?.contactSubtitle} fallback="Get in Touch" className="mt-4 text-base font-medium" style={{ color: '#a0a6b3' }} />
        </div>

        <div className="mx-auto mt-16 max-w-xl rounded-2xl border bg-white p-10 shadow-lg" style={{ borderColor: '#eef0f4', boxShadow: '0 22px 50px rgba(17,24,39,0.1)' }}>
          <div className="space-y-8">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: '#6d67d8' }}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#a0a6b3' }}>邮箱</p>
                <a href={`mailto:${email}`} className="text-lg font-bold text-gray-900 no-underline"><RichText value={t?.contactEmail} fallback="ccy@ccyspace.icu" /></a>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: acc }}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#a0a6b3' }}>位置</p>
                <RichText as="p" value={t?.contactLocation} fallback="中国 · 在线" className="text-lg font-bold text-gray-900" />
              </div>
            </div>

            {resume && (
              <a
                href={resume.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-bold no-underline transition-all hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${acc}, #ff8a2a)`,
                  color: '#fff',
                  boxShadow: `0 18px 38px ${acc}35`,
                }}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/18 text-white ring-1 ring-white/20">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7.5 3.8h6.8L18 7.5v12.2a1.8 1.8 0 0 1-1.8 1.8H7.5a1.8 1.8 0 0 1-1.8-1.8V5.6a1.8 1.8 0 0 1 1.8-1.8Z" />
                      <path d="M14 3.8V8h4" />
                      <path d="M9 12.2h6" />
                      <path d="M9 15.6h5" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-base leading-tight">查看简历</span>
                    <span className="mt-0.5 block text-xs font-medium text-white/70">Resume PDF</span>
                  </span>
                </span>
                <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
              </a>
            )}
          </div>

          <div className="mt-10 text-center">
            <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-full px-9 py-3 text-sm font-bold text-white no-underline transition-transform hover:scale-105" style={{ background: acc }}>
              ✉ <RichText value={t?.contactBtnText} fallback="发送邮件" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
