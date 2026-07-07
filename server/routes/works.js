const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '..', 'uploads', 'images');
    if (file.fieldname === 'video') {
      uploadPath = path.join(__dirname, '..', 'uploads', 'videos');
    } else if (file.fieldname === 'thumbnail' || file.fieldname === 'cover') {
      uploadPath = path.join(__dirname, '..', 'uploads', 'articles');
    }

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
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
]), (req, res) => {
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
    if (type === 'video' && req.files['video']) {
      filePath = '/uploads/videos/' + req.files['video'][0].filename;
    } else if (type === 'image' && req.files['image']) {
      filePath = '/uploads/images/' + req.files['image'][0].filename;
    }

    if (req.files['cover']) {
      thumbnail = '/uploads/articles/' + req.files['cover'][0].filename;
    }
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
});

// PUT /api/works/:id (auth required)
router.put('/:id', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), (req, res) => {
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
      if (existing.file_path) {
        const oldPath = path.join(__dirname, '..', existing.file_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.file_path = '/uploads/videos/' + req.files['video'][0].filename;
    }

    if (req.files['image']) {
      if (existing.file_path) {
        const oldPath = path.join(__dirname, '..', existing.file_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.file_path = '/uploads/images/' + req.files['image'][0].filename;
    }

    if (req.files['cover']) {
      if (existing.thumbnail) {
        const oldPath = path.join(__dirname, '..', existing.thumbnail);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.thumbnail = '/uploads/articles/' + req.files['cover'][0].filename;
    }
  }

  const work = db.updateWork(req.params.id, updateData);
  if (!work) {
    return res.status(404).json({ error: '作品不存在' });
  }

  res.json({ work });
});

// DELETE /api/works/:id (auth required)
router.delete('/:id', authMiddleware, (req, res) => {
  const work = db.getWorkById(req.params.id);
  if (!work) {
    return res.status(404).json({ error: '作品不存在' });
  }

  // Delete associated files
  if (work.file_path) {
    const filePath = path.join(__dirname, '..', work.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  if (work.thumbnail) {
    const thumbPath = path.join(__dirname, '..', work.thumbnail);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
  }

  db.deleteWork(req.params.id);
  res.json({ message: '作品已删除' });
});

module.exports = router;
