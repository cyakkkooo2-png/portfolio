import { RichText, txt, useTheme } from '../context/ThemeContext';

const DISPLAY_TITLE_FONT = "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', SimSun, serif";

function SplitTitle({ value, fallback }) {
  const text = txt(value, fallback);
  if (value?.chars?.some(Boolean)) return <RichText value={value} fallback={fallback} forceFontFamily={DISPLAY_TITLE_FONT} />;
  if (text.length <= 1) return text;
  return <>{text.slice(0, -1)}<span style={{ color: '#ff6600' }}>{text.slice(-1)}</span></>;
}

export default function About() {
  const t = useTheme();
  const image = t?.aboutImage || '';

  return (
    <section id="about" className="relative px-6 py-24 md:px-20" style={{ background: '#f3f3f3' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-gray-900" style={{ fontFamily: DISPLAY_TITLE_FONT, fontSize: 'clamp(42px, 4vw, 56px)', fontWeight: 900, lineHeight: 1.1 }}>
            <SplitTitle value={t?.aboutTitle} fallback="关于我" />
          </h2>
          <p className="mt-4 text-base font-medium" style={{ color: '#a0a6b3' }}>About Me</p>
        </div>

        <div className="grid items-center gap-14 md:grid-cols-[215px_1fr]">
          <div className="mx-auto w-full max-w-[215px] overflow-hidden rounded-2xl bg-white shadow-sm" style={{ aspectRatio: '4/5' }}>
            {image ? (
              <img src={image} alt="关于我" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ background: 'linear-gradient(135deg, #eceef3, #ffffff)' }}>
                <div className="text-center">
                  <div className="text-4xl font-black" style={{ color: '#d5d8df', fontFamily: "'Playfair Display', serif" }}>CCY</div>
                  <p className="mt-3 px-4 text-xs" style={{ color: '#a0a6b3' }}>后台上传关于我图片</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <RichText as="h3" value={t?.aboutHeadline} fallback="创意驱动，无限进步" className="text-2xl font-black leading-snug text-gray-900 md:text-3xl" />
            <div className="mt-8 space-y-5 text-base leading-8" style={{ color: '#687083' }}>
              <RichText as="p" value={t?.aboutBio1} fallback="你好！我是 CCY，一个热爱创作的内容创作者。专注将想法转化为有感染力的视频作品和文字内容。" />
              <RichText as="p" value={t?.aboutBio2} fallback="从视频拍摄到图片设计，从文章写作到 AI 辅助创作，我始终在探索创意的边界。每一个作品都是对世界的独特表达。" />
              <RichText as="p" value={t?.aboutBio3} fallback="如果你有好的创意或合作想法，欢迎随时联系我！" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
