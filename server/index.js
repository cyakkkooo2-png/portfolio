const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const worksRoutes = require('./routes/works');
const statsRoutes = require('./routes/stats');
const contactRoutes = require('./routes/contact');
const themeRoutes = require('./routes/theme');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — increase limits for video uploads
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/theme', themeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve React build static files (production mode)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // SPA fallback — send index.html for any non-API, non-upload route
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return;
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log('📦 前端已构建，由后端托管静态文件');
}

// Seed default admin user if not exists
function seedAdmin() {
  const existing = db.getUserByUsername('admin');
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.createUser({ username: 'admin', password: hash });
    console.log('✅ 默认管理员已创建: admin / admin123');
  }
}

// Start server
app.listen(PORT, () => {
  seedAdmin();
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 上传文件目录: ${path.join(__dirname, 'uploads')}`);
});
