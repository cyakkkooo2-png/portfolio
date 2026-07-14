const fs = require('fs');
const path = require('path');

const SERVER_DIR = __dirname;
const DEFAULT_DATA_DIR = path.join(SERVER_DIR, 'data');
const DEFAULT_UPLOADS_DIR = path.join(SERVER_DIR, 'uploads');

const DATA_DIR = process.env.DATA_DIR || DEFAULT_DATA_DIR;
const UPLOADS_DIR = process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR;
const TMP_DIR = process.env.TMP_DIR || path.join(SERVER_DIR, 'tmp');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function dataFile(name) {
  return path.join(DATA_DIR, name);
}

function uploadDir(folder = '') {
  return path.join(UPLOADS_DIR, folder);
}

function uploadPathFromUrl(url = '') {
  if (!url.startsWith('/uploads/')) return '';
  const relative = url.replace(/^\/uploads\//, '').split(/[?#]/)[0];
  const resolved = path.resolve(UPLOADS_DIR, relative);
  const root = path.resolve(UPLOADS_DIR);
  return resolved.startsWith(root + path.sep) || resolved === root ? resolved : '';
}

function seedDataFile(name, fallback) {
  ensureDir(DATA_DIR);
  const dest = dataFile(name);
  if (fs.existsSync(dest)) return;

  const bundled = path.join(DEFAULT_DATA_DIR, name);
  if (DATA_DIR !== DEFAULT_DATA_DIR && fs.existsSync(bundled)) {
    fs.copyFileSync(bundled, dest);
    return;
  }

  fs.writeFileSync(dest, JSON.stringify(fallback, null, 2), { encoding: 'utf8' });
}

module.exports = {
  DATA_DIR,
  UPLOADS_DIR,
  TMP_DIR,
  DEFAULT_DATA_DIR,
  ensureDir,
  dataFile,
  uploadDir,
  uploadPathFromUrl,
  seedDataFile,
};
