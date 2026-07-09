const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const githubStorage = require('../github-storage');
const cosStorage = require('../cos-storage');

const router = express.Router();

const TMP_DIR = path.join(__dirname, '..', 'tmp');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
['images', 'videos', 'articles'].forEach(s => {
  const p = path.join(UPLOADS_DIR, s);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TMP_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = {
      image: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
      video: /\.(mp4|webm|mov|avi|mkv)$/i,
      thumbnail: /\.(jpg|jpeg|png|gif|webp)$/i,
      cover: /\.(jpg|jpeg|png|gif|webp)$/i,
    };
    const pattern = allowed[file.fieldname];
    cb(pattern?.test(path.extname(file.originalname)) ? null : new Error('不支持的文件格式'), pattern?.test(path.extname(file.originalname)));
  },
});

async function uploadToStorage(tmpPath, folder, filename) {
  if (folder === 'videos') {
    const localDest = path.join(UPLOADS_DIR, folder, filename);
    fs.copyFileSync(tmpPath, localDest);
    if (process.env.COS_SECRET_ID) {
      setImmediate(async () => {
        try {
          const cosUrl = await cosStorage.uploadFile(localDest, folder);
          const works = db.getWorks();
          const work = works.find(w => w.file_path === `/uploads/videos/${filename}`);
          if (work) { db.updateWork(work.id, { file_path: cosUrl }); }
          fs.unlink(localDest, () => {});
        } catch (err) { console.error('COS bg upload failed:', err.message); }
      });
    }
    return `/uploads/videos/${filename}`;
  }

  if (process.env.GITHUB_TOKEN) {
    try {
      const result = await githubStorage.uploadFile(tmpPath, folder);
      if (!result.local) return result.url;
    } catch (err) { console.error('GitHub fail:', err.message); }
  }

  const localDest = path.join(UPLOADS_DIR, folder, filename);
  fs.copyFileSync(tmpPath, localDest);
  return `/uploads/${folder}/${filename}`;
}

async function deleteFromStorage(filePathOrUrl) {
  if (!filePathOrUrl) return;
  if (filePathOrUrl.includes('.myqcloud.com/')) {
    try { await cosStorage.deleteFile(filePathOrUrl); } catch {}
  }
  if (filePathOrUrl.includes('raw.githubusercontent.com')) {
    try { await githubStorage.deleteFile(filePathOrUrl); } catch {}
  }
  if (filePathOrUrl.startsWith('/uploads/')) {
    const p = path.join(__dirname, '..', filePathOrUrl);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

// GET /api/works
router.get('/', (req, res) => {
  const works = db.getWorks(req.query.type ? { type: req.query.type } : {});
  res.json({ works });
});

// GET /api/works/:id
router.get('/:id', (req, res) => {
  const work = db.getWorkById(req.params.id);
  if (!work) return res.status(404).json({ error: '作品不存在' });
  res.json({ work });
});

// POST /api/works
router.post('/', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'cover', maxCount: 1 },
]), async (req, res) => {
  try {
    const { title, description, type, content, tags } = req.body;
    if (!title || !type) return res.status(400).json({ error: '标题和类型为必填项' });
    if (!['video', 'image', 'article'].includes(type)) return res.status(400).json({ error: '无效的类型' });

    let filePath = '', thumbnail = '', totalFileSize = 0;

    if (req.files) {
      if (type === 'video' && req.files.video) {
        const f = req.files.video[0];
        filePath = await uploadToStorage(f.path, 'videos', f.filename);
        totalFileSize += f.size || 0;
      } else if (type === 'image' && req.files.image) {
        const f = req.files.image[0];
        filePath = await uploadToStorage(f.path, 'images', f.filename);
        totalFileSize += f.size || 0;
      }
      if (req.files.cover) {
        const f = req.files.cover[0];
        thumbnail = await uploadToStorage(f.path, 'articles', f.filename);
        totalFileSize += f.size || 0;
      }
      Object.values(req.files).flat().forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }

    const work = db.createWork({
      title, description: description || '', type,
      file_path: filePath, content: content || '', thumbnail,
      tags: typeof tags === 'string' ? JSON.parse(tags) : (tags || []),
      file_size: totalFileSize || null,
    });

    res.status(201).json({ work });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: '上传失败: ' + err.message });
  }
});

// PUT /api/works/:id
router.put('/:id', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'cover', maxCount: 1 },
]), async (req, res) => {
  try {
    const existing = db.getWorkById(req.params.id);
    if (!existing) return res.status(404).json({ error: '作品不存在' });

    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.type) updateData.type = req.body.type;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.tags) updateData.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;

    let totalFileSize = existing.file_size || 0;

    if (req.files) {
      if (req.files.video) {
        await deleteFromStorage(existing.file_path);
        const f = req.files.video[0];
        updateData.file_path = await uploadToStorage(f.path, 'videos', f.filename);
        totalFileSize = f.size || 0;
      }
      if (req.files.image) {
        await deleteFromStorage(existing.file_path);
        const f = req.files.image[0];
        updateData.file_path = await uploadToStorage(f.path, 'images', f.filename);
        totalFileSize = f.size || 0;
      }
      if (req.files.cover) {
        await deleteFromStorage(existing.thumbnail);
        const f = req.files.cover[0];
        updateData.thumbnail = await uploadToStorage(f.path, 'articles', f.filename);
      }
      Object.values(req.files).flat().forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }

    updateData.file_size = totalFileSize;

    const work = db.updateWork(req.params.id, updateData);
    if (!work) return res.status(404).json({ error: '作品不存在' });
    res.json({ work });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

// DELETE /api/works/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const work = db.getWorkById(req.params.id);
    if (!work) return res.status(404).json({ error: '作品不存在' });
    await deleteFromStorage(work.file_path);
    await deleteFromStorage(work.thumbnail);
    db.deleteWork(req.params.id);
    res.json({ message: '已删除' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: '删除失败: ' + err.message });
  }
});

module.exports = router;
