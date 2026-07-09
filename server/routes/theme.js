const express = require('express');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
const FILE = path.join(__dirname, '..', 'data', 'theme.json');

const def = {
  heroTag: { text: 'Creative Space · 2026', font: 'Inter', size: 12, color: 'rgba(255,255,255,0.8)' },
  heroTitle: { text: '创意.空间', font: 'Playfair Display', size: 72, color: '#ffffff' },
  heroSubtitle: { text: '用镜头捕捉瞬间，用文字记录思考。', font: 'Inter', size: 18, color: 'rgba(255,255,255,0.65)' },
  heroBtn1: { text: '查看作品', font: 'Inter', size: 14, color: '#ffffff' },
  heroBtn2: { text: '联系我', font: 'Inter', size: 14, color: '#ffffff' },
  worksTitle: { text: '精选作品', font: 'Playfair Display', size: 48, color: '#111111' },
  worksSubtitle: { text: 'Selected works', font: 'Inter', size: 16, color: '#9ca3af' },
  worksEmpty: { text: '还没有作品', font: 'Inter', size: 16, color: '#9ca3af' },
  aboutTitle: { text: '关于我', font: 'Playfair Display', size: 48, color: '#111111' },
  aboutHeadline: { text: '创意驱动，无限进步', font: 'Playfair Display', size: 20, color: '#6b7280' },
  aboutBio1: { text: '你好！我是 CCY。', font: 'Inter', size: 16, color: '#4b5563' },
  aboutBio2: { text: '从视频到图片到文章。', font: 'Inter', size: 16, color: '#4b5563' },
  aboutBio3: { text: '欢迎随时联系我！', font: 'Inter', size: 16, color: '#4b5563' },
  contactTitle: { text: '联系合作', font: 'Playfair Display', size: 48, color: '#111111' },
  contactSubtitle: { text: 'Get in Touch', font: 'Inter', size: 16, color: '#9ca3af' },
  contactEmail: { text: 'ccy@ccyspace.icu', font: 'Inter', size: 14, color: '#111' },
  contactLocation: { text: '中国 · 在线', font: 'Inter', size: 14, color: '#111' },
  contactBtnText: { text: '发送邮件', font: 'Inter', size: 14, color: '#ffffff' },
  navHome: { text: '首页' }, navWork: { text: '作品' }, navAbout: { text: '关于' }, navContact: { text: '联系' },
  footerTitle: { text: 'CCY.SPACE' }, footerTagline: { text: 'ccyspace.icu — 创意空间' }, footerCopyright: { text: '© 2026 CCY SPACE' },
  accentColor: '#ff6600', primaryColor: '#3b82f6',
};

function L() { try { if (fs.existsSync(FILE)) return { ...def, ...JSON.parse(fs.readFileSync(FILE, 'utf-8')) }; } catch {} return { ...def }; }
function S(d) { const dir = path.dirname(FILE); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2), { encoding: 'utf8' }); }

router.get('/', (req, res) => res.json(L()));
router.put('/', authMiddleware, (req, res) => {
  const current = L();
  // Deep merge: request body fields take priority over current
  const merged = { ...current, ...req.body };
  // Also merge nested objects properly
  for (const k of Object.keys(req.body)) {
    if (typeof req.body[k] === 'object' && req.body[k] !== null && !Array.isArray(req.body[k])) {
      merged[k] = { ...(current[k] || {}), ...req.body[k] };
    }
  }
  S(merged);
  res.json(merged);
});
// POST /api/theme/reset — wipe saved data, use defaults
router.post('/reset', authMiddleware, (req, res) => {
  try { fs.unlinkSync(FILE); } catch {}
  res.json(L());
});
module.exports = router;
