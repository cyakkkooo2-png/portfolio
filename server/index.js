const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const worksRoutes = require('./routes/works');
const statsRoutes = require('./routes/stats');
const contactRoutes = require('./routes/contact');
const themeRoutes = require('./routes/theme');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/theme', themeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return;
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log('Frontend build found; serving static files from the server.');
}

function seedAdmin() {
  const existing = db.getUserByUsername('admin');
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.createUser({ username: 'admin', password: hash });
    console.log('Default admin created: admin / admin123');
  }
}

app.listen(PORT, () => {
  seedAdmin();
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Upload directory: ${path.join(__dirname, 'uploads')}`);
});
