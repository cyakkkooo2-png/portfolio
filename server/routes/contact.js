const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { dataFile, uploadDir, ensureDir } = require('../paths');
const router = express.Router();

const UD = uploadDir('resumes');
const RF = dataFile('resume.json');
ensureDir(UD);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UD),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx', '.zip', '.jpg', '.png'];
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('不支持的文件格式: ' + ext));
  },
});

// GET /api/contact/resume — public
router.get('/resume', (req, res) => {
  try { if (fs.existsSync(RF)) return res.json(JSON.parse(fs.readFileSync(RF, 'utf-8'))); } catch {}
  res.json(null);
});

// POST /api/contact/resume — admin
router.post('/resume', authMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || '上传失败' });
    if (!req.file) return res.status(400).json({ error: '请选择文件' });
    const d = {
      url: '/uploads/resumes/' + req.file.filename,
      name: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    };
    const dir = path.dirname(RF);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(RF, JSON.stringify(d, null, 2), { encoding: 'utf8' });
    res.json(d);
  });
});

// DELETE /api/contact/resume — admin
router.delete('/resume', authMiddleware, (req, res) => {
  try { fs.unlinkSync(RF); } catch {}
  res.json({ ok: true });
});

module.exports = router;
