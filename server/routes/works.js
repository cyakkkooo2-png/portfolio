const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
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

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function pick(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].replace(/<[^>]+>/g, ''));
  }
  return '';
}

function pickAll(html, pattern) {
  return [...html.matchAll(pattern)].map(m => decodeHtml(m[1])).filter(Boolean);
}

function isBilibiliUrl(url = '') {
  return /(^|\.)bilibili\.com|b23\.tv/i.test(url);
}

function normalizeMediaUrl(url = '', baseUrl = '') {
  let value = decodeHtml(url)
    .replace(/\\u002[fF]/g, '/')
    .replace(/\\\//g, '/')
    .trim();

  if (!value) return '';
  if (value.startsWith('//')) value = `https:${value}`;
  if (/hdslb\.com/i.test(value)) value = value.replace(/@[^/?#]+(?=([?#]|$))/i, '');
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/') && /^https?:\/\//i.test(baseUrl)) {
    try {
      return new URL(value, baseUrl).toString();
    } catch {
      return value;
    }
  }
  return value;
}

function extractBilibiliIds(inputUrl = '', html = '') {
  const source = `${inputUrl}\n${html}`;
  const bvid = source.match(/BV[0-9A-Za-z]{10}/i)?.[0];
  const aid = source.match(/(?:\/video\/av|[?&]aid=|["']aid["']\s*:\s*)(\d+)/i)?.[1];
  return { bvid, aid };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`网页读取失败 (${response.status})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const type = response.headers.get('content-type') || '';
  const charset = /charset=([^;]+)/i.exec(type)?.[1] || /<meta[^>]+charset=["']?([^"'\s/>]+)/i.exec(buffer.toString('latin1'))?.[1] || 'utf-8';
  try {
    return new TextDecoder(charset.toLowerCase()).decode(buffer);
  } catch {
    return buffer.toString('utf8');
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      Accept: 'application/json,text/plain,*/*',
      Referer: 'https://www.bilibili.com/',
      Origin: 'https://www.bilibili.com',
    },
  });
  if (!response.ok) throw new Error(`接口读取失败 (${response.status})`);
  return response.json();
}

async function fetchBilibiliMeta(inputUrl, html) {
  const { bvid, aid } = extractBilibiliIds(inputUrl, html);
  if (!bvid && !aid) return null;

  const apiUrl = bvid
    ? `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`
    : `https://api.bilibili.com/x/web-interface/view?aid=${encodeURIComponent(aid)}`;

  const json = await fetchJson(apiUrl);
  if (json?.code !== 0 || !json?.data) return null;

  return {
    title: json.data.title || '',
    description: json.data.desc || '',
    thumbnail: normalizeMediaUrl(json.data.pic || ''),
    tags: [json.data.tname].filter(Boolean),
  };
}

async function extractFromUrl(inputUrl) {
  let pageUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(pageUrl)) throw new Error('请输入完整链接，例如 https://...');

  const pcVideoId = /pconline\.pcvideo\.com\.cn\/video-(\d+)\.html/i.exec(pageUrl)?.[1];
  if (pcVideoId) pageUrl = `https://mpconline.pcvideo.com.cn/${pcVideoId}.html`;

  const html = await fetchHtml(pageUrl);
  const sourceUrl = pageUrl;
  const isBilibili = isBilibiliUrl(inputUrl) || isBilibiliUrl(pageUrl);
  const bilibiliMeta = isBilibili ? await fetchBilibiliMeta(inputUrl, html).catch((err) => {
    console.warn('Bilibili API fallback failed:', err.message);
    return null;
  }) : null;
  const title = pick(html, [
    /<p[^>]+class=["'][^"']*\btit\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ]).replace(/[-_]?太平洋科技视频?$|[-_]?太平洋科技$/g, '').trim();
  const description = pick(html, [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<p[^>]+class=["'][^"']*\bdesc\b[^"']*["'][^>]*>[\s\S]*?<span[^>]*>[^<]*<\/span>([\s\S]*?)<\/p>/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  ]);
  const thumbnail = bilibiliMeta?.thumbnail || normalizeMediaUrl(pick(html, [
    /<video[^>]+poster=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i,
    /"pic"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
    /"cover"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
    /"images"\s*:\s*\[\s*["']([^"']+)["']/i,
  ]), sourceUrl);
  const videoUrl = pick(html, [
    /<source[^>]+src=["']([^"']+\.mp4[^"']*)["']/i,
    /<video[^>]+src=["']([^"']+\.mp4[^"']*)["']/i,
  ]);
  const tags = pickAll(html, /<span[^>]+class=["'][^"']*\btag\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi);

  return {
    title: bilibiliMeta?.title || title || '未命名作品',
    description: bilibiliMeta?.description || description,
    type: (videoUrl || isBilibili) ? 'video' : 'article',
    file_path: isBilibili ? '' : videoUrl,
    thumbnail,
    content: (videoUrl || isBilibili) ? '' : description,
    tags: isBilibili ? Array.from(new Set(['B站', ...(bilibiliMeta?.tags || []), ...tags])) : tags,
    source_url: inputUrl.trim(),
    external_url: sourceUrl,
  };
}

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

// GET /api/works/proxy-video?url=...
// Browser playback can fail when an imported external MP4 is embedded directly.
// This streams only URLs that already exist in saved works, so it cannot be used as an open proxy.
router.get('/proxy-video', async (req, res) => {
  try {
    const url = String(req.query.url || '');
    if (!/^https?:\/\//i.test(url)) return res.status(400).send('Invalid video URL');

    const allowed = db.getWorks().some(work => work.file_path === url && work.type === 'video');
    if (!allowed) return res.status(403).send('Video URL is not in works');

    const upstream = await fetch(url, {
      headers: {
        'User-Agent': req.get('user-agent') || 'Mozilla/5.0',
        Accept: req.get('accept') || '*/*',
        Range: req.get('range') || '',
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).send('Video source unavailable');
    }

    res.status(upstream.status);
    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'last-modified', 'etag'].forEach((name) => {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!upstream.body) return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('Proxy video error:', err);
    res.status(500).send('Video proxy failed');
  }
});

// GET /api/works/proxy-image?url=...
// Some third-party thumbnails block hotlinking. Proxy only saved work images.
router.get('/proxy-image', async (req, res) => {
  try {
    const url = normalizeMediaUrl(String(req.query.url || ''));
    if (!/^https?:\/\//i.test(url)) return res.status(400).send('Invalid image URL');

    const allowed = db.getWorks().some((work) => normalizeMediaUrl(work.thumbnail) === url || normalizeMediaUrl(work.file_path) === url);
    if (!allowed) return res.status(403).send('Image URL is not in works');

    const upstream = await fetch(url, {
      headers: {
        'User-Agent': req.get('user-agent') || 'Mozilla/5.0',
        Accept: req.get('accept') || 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: /hdslb\.com/i.test(url) ? 'https://www.bilibili.com/' : new URL(url).origin,
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).send('Image source unavailable');
    }

    ['content-type', 'content-length', 'cache-control', 'last-modified', 'etag'].forEach((name) => {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (!upstream.body) return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('Proxy image error:', err);
    res.status(500).send('Image proxy failed');
  }
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

// POST /api/works/import-url
router.post('/import-url', authMiddleware, upload.fields([
  { name: 'cover', maxCount: 1 },
]), async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: '请输入网页链接' });

    const data = await extractFromUrl(url);
    if (req.files?.cover?.[0]) {
      const f = req.files.cover[0];
      data.thumbnail = await uploadToStorage(f.path, 'articles', f.filename);
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    }
    const work = db.createWork(data);
    res.status(201).json({ work, extracted: data });
  } catch (err) {
    console.error('Import URL error:', err);
    res.status(500).json({ error: '导入失败: ' + err.message });
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
