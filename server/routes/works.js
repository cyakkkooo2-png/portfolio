const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const githubStorage = require('../github-storage');

const router = express.Router();

// Temp upload dir (files will be moved to GitHub storage after upload)
const TMP_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Keep local uploads dir for dev fallback
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
['images', 'videos', 'articles'].forEach(sub => {
  const p = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// Configure multer — save to tmp first, then upload to GitHub
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      image: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
      video: /\.(mp4|webm|mov|avi|mkv)$/i,
      thumbnail: /\.(jpg|jpeg|png|gif|webp)$/i,
      cover: /\.(jpg|jpeg|png|gif|webp)$/i,
    };
    const pattern = allowedTypes[file.fieldname];
    if (pattern && pattern.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件格式: ${path.extname(file.originalname)}`));
    }
  },
});

/**
 * Upload a single file — tries GitHub first, falls back to local
 */
async function uploadToStorage(tmpPath, folder, filename) {
  // Try GitHub storage
  if (process.env.GITHUB_TOKEN) {
    try {
      const url = await githubStorage.uploadFile(tmpPath, folder);
      // Also keep a local copy for fast serving
      const localDest = path.join(UPLOADS_DIR, folder, filename);
      fs.copyFileSync(tmpPath, localDest);
      return url; // Return GitHub URL
    } catch (err) {
      console.error('GitHub upload failed, using local fallback:', err.message);
    }
  }
  // Fallback to local
  const localDest = path.join(UPLOADS_DIR, folder, filename);
  fs.copyFileSync(tmpPath, localDest);
  return `/uploads/${folder}/${filename}`;
}

/**
 * Delete a file from storage
 */
async function deleteFromStorage(filePathOrUrl) {
  if (!filePathOrUrl) return;

  // GitHub URL
  if (filePathOrUrl.includes('raw.githubusercontent.com')) {
    try {
      await githubStorage.deleteFile(filePathOrUrl);
    } catch (err) {
      console.error('GitHub delete failed:', err.message);
    }
  }

  // Local file
  if (filePathOrUrl.startsWith('/uploads/')) {
    const localPath = path.join(__dirname, '..', filePathOrUrl);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }
}

// GET /api/works
router.get('/', (req, res) => {
  const { type } = req.query;
  const works = db.getWorks(type ? { type } : {});
  res.json({ works });
});

// GET /api/works/:id
router.get('/:id', (req, res) => {
  const work = db.getWorkById(req.params.id);
  if (!work) {
    return res.status(404).json({ error: '作品不存在' });
  }
  res.json({ work });
});

// POST /api/works (auth required)
router.post('/', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), async (req, res) => {
  try {
    const { title, description, type, content, tags } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: '标题和类型为必填项' });
    }

    if (!['video', 'image', 'article'].includes(type)) {
      return res.status(400).json({ error: '无效的作品类型' });
    }

    let filePath = '';
    let thumbnail = '';

    if (req.files) {
      const folderMap = { video: 'videos', image: 'images', cover: 'articles', thumbnail: 'articles' };

      if (type === 'video' && req.files['video']) {
        const f = req.files['video'][0];
        filePath = await uploadToStorage(f.path, 'videos', f.filename);
      } else if (type === 'image' && req.files['image']) {
        const f = req.files['image'][0];
        filePath = await uploadToStorage(f.path, 'images', f.filename);
      }

      if (req.files['cover']) {
        const f = req.files['cover'][0];
        thumbnail = await uploadToStorage(f.path, 'articles', f.filename);
      }

      // Clean up tmp files
      Object.values(req.files).flat().forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }

    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    const work = db.createWork({
      title,
      description: description || '',
      type,
      file_path: filePath,
      content: content || '',
      thumbnail,
      tags: parsedTags,
    });

    res.status(201).json({ work });
  } catch (err) {
    console.error('Create work error:', err);
    res.status(500).json({ error: '上传失败: ' + err.message });
  }
});

// PUT /api/works/:id (auth required)
router.put('/:id', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), async (req, res) => {
  try {
    const existing = db.getWorkById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '作品不存在' });
    }

    const updateData = {};

    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.type) updateData.type = req.body.type;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.tags) {
      updateData.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
    }

    if (req.files) {
      if (req.files['video']) {
        const f = req.files['video'][0];
        await deleteFromStorage(existing.file_path);
        updateData.file_path = await uploadToStorage(f.path, 'videos', f.filename);
      }

      if (req.files['image']) {
        const f = req.files['image'][0];
        await deleteFromStorage(existing.file_path);
        updateData.file_path = await uploadToStorage(f.path, 'images', f.filename);
      }

      if (req.files['cover']) {
        const f = req.files['cover'][0];
        await deleteFromStorage(existing.thumbnail);
        updateData.thumbnail = await uploadToStorage(f.path, 'articles', f.filename);
      }

      // Clean up tmp files
      Object.values(req.files).flat().forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }

    const work = db.updateWork(req.params.id, updateData);
    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    res.json({ work });
  } catch (err) {
    console.error('Update work error:', err);
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

// DELETE /api/works/:id (auth required)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const work = db.getWorkById(req.params.id);
    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    await deleteFromStorage(work.file_path);
    await deleteFromStorage(work.thumbnail);

    db.deleteWork(req.params.id);
    res.json({ message: '作品已删除' });
  } catch (err) {
    console.error('Delete work error:', err);
    res.status(500).json({ error: '删除失败: ' + err.message });
  }
});

module.exports = router;
