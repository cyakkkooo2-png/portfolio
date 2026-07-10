import { useEffect, useState } from 'react';
import { RichText, txt, useTheme } from '../context/ThemeContext';

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
    fetch('/api/contact/resume').then((r) => r.json()).then((d) => { if (d?.url) setResume(d); }).catch(() => {});
  }, []);

  return (
    <section id="contact" className="relative px-6 py-28 md:px-20" style={{ background: '#fff' }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-gray-900" style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", fontSize: 'clamp(42px, 4vw, 58px)', fontWeight: 900, lineHeight: 1.1 }}>
            <SplitTitle value={t?.contactTitle} fallback="联系合作" />
          </h2>
          <RichText as="p" value={t?.contactSubtitle} fallback="Get in Touch" className="mt-4 text-base font-medium" style={{ color: '#a0a6b3' }} />
        </div>

        <div className="mx-auto mt-16 max-w-xl rounded-2xl border bg-white p-10 shadow-lg" style={{ borderColor: '#eef0f4', boxShadow: '0 22px 50px rgba(17,24,39,0.1)' }}>
          <div className="space-y-8">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: '#6d67d8' }}>✉</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#a0a6b3' }}>邮箱</p>
                <a href={`mailto:${email}`} className="text-lg font-bold text-gray-900 no-underline"><RichText value={t?.contactEmail} fallback="ccy@ccyspace.icu" /></a>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: acc }}>⌖</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#a0a6b3' }}>位置</p>
                <RichText as="p" value={t?.contactLocation} fallback="中国 · 在线" className="text-lg font-bold text-gray-900" />
              </div>
            </div>

            {resume && <a href={resume.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl px-4 py-3 text-sm font-semibold no-underline" style={{ background: '#f7f8fb', color: '#687083' }}>查看附件：{resume.name}</a>}
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
