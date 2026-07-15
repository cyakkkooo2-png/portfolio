const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { TMP_DIR, dataFile, uploadDir, ensureDir, uploadPathFromUrl, seedDataFile } = require('../paths');

const router = express.Router();
const FILE = dataFile('theme.json');
const ABOUT_DIR = uploadDir('about');

for (const dir of [TMP_DIR, ABOUT_DIR]) ensureDir(dir);

const def = {
  heroTag: { text: 'Creative Space · 2026', font: 'Inter', size: 12, color: 'rgba(255,255,255,0.8)' },
  heroTitle: { text: '创意.空间', font: 'Playfair Display', size: 72, color: '#ffffff' },
  heroSubtitle: { text: '用镜头捕捉瞬间，用文字记录思考。这里是视频、影像与文字的创意集合。', font: 'Inter', size: 18, color: 'rgba(255,255,255,0.65)' },
  heroBtn1: { text: '查看作品', font: 'Inter', size: 14, color: '#ffffff' },
  heroBtn2: { text: '联系我', font: 'Inter', size: 14, color: '#ffffff' },
  worksTitle: { text: '部分作品', font: 'Playfair Display', size: 48, color: '#111111' },
  worksSubtitle: { text: 'Selected works across video, image and writing', font: 'Inter', size: 16, color: '#9ca3af' },
  worksEmpty: { text: '还没有作品', font: 'Inter', size: 16, color: '#9ca3af' },
  aboutTitle: { text: '关于我', font: 'Playfair Display', size: 48, color: '#111111' },
  aboutHeadline: { text: '创意驱动，无限进步', font: 'Playfair Display', size: 20, color: '#111827' },
  aboutBio1: { text: '你好！我是 CCY，一个热爱创作的内容创作者。专注将想法转化为有感染力的视频作品和文字内容。', font: 'Inter', size: 16, color: '#4b5563' },
  aboutBio2: { text: '从视频拍摄到图片设计，从文章写作到 AI 辅助创作，我始终在探索创意的边界。每一个作品都是对世界的独特表达。', font: 'Inter', size: 16, color: '#4b5563' },
  aboutBio3: { text: '如果你有好的创意或合作想法，欢迎随时联系我！', font: 'Inter', size: 16, color: '#4b5563' },
  aboutImage: '',
  contactTitle: { text: '联系合作', font: 'Playfair Display', size: 48, color: '#111111' },
  contactSubtitle: { text: 'Get in Touch', font: 'Inter', size: 16, color: '#9ca3af' },
  contactEmail: { text: 'ccy@ccyspace.icu', font: 'Inter', size: 14, color: '#111111' },
  contactLocation: { text: '中国 · 在线', font: 'Inter', size: 14, color: '#111111' },
  contactBtnText: { text: '发送邮件', font: 'Inter', size: 14, color: '#ffffff' },
  navHome: { text: '首页', font: 'Inter', size: 14, color: '#ffffff' },
  navWork: { text: '作品', font: 'Inter', size: 14, color: '#ffffff' },
  navAbout: { text: '关于', font: 'Inter', size: 14, color: '#ffffff' },
  navContact: { text: '联系', font: 'Inter', size: 14, color: '#ffffff' },
  footerTitle: { text: 'CCY.SPACE' },
  footerTagline: { text: 'ccyspace.icu — 创意空间', font: 'Inter', size: 14, color: 'rgba(255,255,255,0.38)' },
  footerCopyright: { text: '© 2026 CCY SPACE. All rights reserved.', font: 'Inter', size: 12, color: 'rgba(255,255,255,0.28)' },
  accentColor: '#ff6600',
  primaryColor: '#3b82f6',
};

seedDataFile('theme.json', def);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpg|jpeg|png|gif|webp)$/i.test(path.extname(file.originalname));
    cb(ok ? null : new Error('只支持 jpg、png、gif、webp 图片'), ok);
  },
});

function loadTheme() {
  try {
    if (fs.existsSync(FILE)) return { ...def, ...JSON.parse(fs.readFileSync(FILE, 'utf-8')) };
  } catch {}
  return { ...def };
}

function saveTheme(data) {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), { encoding: 'utf8' });
}

function deleteLocalUpload(url) {
  if (!url || !url.startsWith('/uploads/about/')) return;
  const filePath = uploadPathFromUrl(url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

router.get('/', (req, res) => res.json(loadTheme()));

router.put('/', authMiddleware, (req, res) => {
  const current = loadTheme();
  const merged = { ...current, ...req.body };
  for (const k of Object.keys(req.body)) {
    if (typeof req.body[k] === 'object' && req.body[k] !== null && !Array.isArray(req.body[k])) {
      merged[k] = { ...(current[k] || {}), ...req.body[k] };
    }
  }
  saveTheme(merged);
  res.json(merged);
});

router.post('/about-image', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择图片文件' });
    const current = loadTheme();
    const dest = path.join(ABOUT_DIR, req.file.filename);
    fs.copyFileSync(req.file.path, dest);
    fs.unlinkSync(req.file.path);
    deleteLocalUpload(current.aboutImage);
    const next = { ...current, aboutImage: `/uploads/about/${req.file.filename}` };
    saveTheme(next);
    res.json(next);
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: `上传失败：${err.message}` });
  }
});

router.post('/reset', authMiddleware, (req, res) => {
  try { fs.unlinkSync(FILE); } catch {}
  res.json(loadTheme());
});

module.exports = router;
