const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const WORKS_FILE = path.join(DATA_DIR, 'works.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(WORKS_FILE)) {
  fs.writeFileSync(WORKS_FILE, JSON.stringify([]), { encoding: 'utf8' });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]), { encoding: 'utf8' });
}

// --- Works ---
function getWorks(filter = {}) {
  const works = JSON.parse(fs.readFileSync(WORKS_FILE, 'utf-8'));
  if (filter.type) {
    return works.filter(w => w.type === filter.type).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return works.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getWorkById(id) {
  const works = JSON.parse(fs.readFileSync(WORKS_FILE, 'utf-8'));
  return works.find(w => w.id === id) || null;
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
