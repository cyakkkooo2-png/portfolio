const fs = require('fs');
const { DATA_DIR, dataFile, seedDataFile } = require('../paths');

const WORKS_FILE = dataFile('works.json');
const USERS_FILE = dataFile('users.json');

seedDataFile('works.json', []);
seedDataFile('users.json', []);

// --- Works ---
function fallbackTitle(work) {
  const savedTitle = String(work.title || '').trim();
  if (savedTitle) return savedTitle;

  const source = String(work.file_path || work.source_url || '');
  const rawName = source.split('?')[0].split('/').pop() || '';
  return rawName.replace(/\.[^/.]+$/, '') || '未命名视频';
}

function withFallbackTitle(work) {
  return { ...work, title: fallbackTitle(work) };
}

function getWorks(filter = {}) {
  const works = JSON.parse(fs.readFileSync(WORKS_FILE, 'utf-8'));
  return works
    .filter(w => !filter.type || w.type === filter.type)
    .filter(w => !filter.category || w.category === filter.category)
    .map(withFallbackTitle)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getWorkById(id) {
  const works = JSON.parse(fs.readFileSync(WORKS_FILE, 'utf-8'));
  const work = works.find(w => w.id === id);
  return work ? withFallbackTitle(work) : null;
}

function createWork(data) {
  const works = JSON.parse(fs.readFileSync(WORKS_FILE, 'utf-8'));
  const { v4: uuidv4 } = require('uuid');
  const work = {
    id: uuidv4(),
    title: data.title,
    description: data.description || '',
    type: data.type,
    file_path: data.file_path || '',
    file_size: data.file_size || null, // bytes
    content: data.content || '',
    thumbnail: data.thumbnail || '',
    source_url: data.source_url || '',
    external_url: data.external_url || '',
    tags: data.tags || [],
    category: data.type === 'video' ? (data.category || '') : '',
    created_at: new Date().toISOString(),
  };
  works.push(work);
  fs.writeFileSync(WORKS_FILE, JSON.stringify(works, null, 2), { encoding: 'utf8' });
  return work;
}

function updateWork(id, data) {
  const works = JSON.parse(fs.readFileSync(WORKS_FILE, 'utf-8'));
  const index = works.findIndex(w => w.id === id);
  if (index === -1) return null;
  works[index] = { ...works[index], ...data, id }; // preserve id
  fs.writeFileSync(WORKS_FILE, JSON.stringify(works, null, 2), { encoding: 'utf8' });
  return works[index];
}

function deleteWork(id) {
  const works = JSON.parse(fs.readFileSync(WORKS_FILE, 'utf-8'));
  const index = works.findIndex(w => w.id === id);
  if (index === -1) return false;
  works.splice(index, 1);
  fs.writeFileSync(WORKS_FILE, JSON.stringify(works, null, 2), { encoding: 'utf8' });
  return true;
}

// --- Users ---
function getUserByUsername(username) {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  return users.find(u => u.username === username) || null;
}

function getUserById(id) {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  return users.find(u => u.id === id) || null;
}

function createUser(data) {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const { v4: uuidv4 } = require('uuid');
  const user = {
    id: uuidv4(),
    username: data.username,
    password: data.password,
  };
  users.push(user);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { encoding: 'utf8' });
  return user;
}

module.exports = { getWorks, getWorkById, createWork, updateWork, deleteWork, getUserByUsername, getUserById, createUser };
