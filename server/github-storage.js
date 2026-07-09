/**
 * GitHub Storage — two strategies:
 *   Small files (<80MB): GitHub Content API (simple, inline in repo)
 *   Large files (videos): GitHub Releases API (streaming, up to 2GB)
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_OWNER = 'cyakkkooo2-png';
const REPO_NAME = 'portfolio';
const STORAGE_BRANCH = 'master';
const STORAGE_PATH = 'storage';
const MAX_CONTENT_SIZE = 80 * 1024 * 1024; // 80MB - use Content API
const RELEASE_TAG = 'video-uploads';        // tag for the video release

function githubRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method: method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'portfolio-app',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(json.message || `HTTP ${res.statusCode}`));
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
          }
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ---- Small files: Content API ----
async function uploadSmallFile(filePath, folder) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Content = fileBuffer.toString('base64');
  const fileName = path.basename(filePath);
  const githubFilePath = `${STORAGE_PATH}/${folder}/${fileName}`;

  // Check if file already exists
  let sha = null;
  try {
    const existing = await githubRequest(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${githubFilePath}?ref=${STORAGE_BRANCH}`
    );
    sha = existing.sha;
  } catch {}

  await githubRequest(
    'PUT',
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${githubFilePath}`,
    {
      message: `Upload: ${folder}/${fileName}`,
      content: base64Content,
      branch: STORAGE_BRANCH,
      ...(sha ? { sha } : {}),
    }
  );

  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${STORAGE_BRANCH}/${githubFilePath}`;
}

// ---- Large files: Releases API (streaming, no memory pressure) ----
async function getOrCreateRelease() {
  // Find existing release by tag
  try {
    const releases = await githubRequest(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/releases`
    );
    const existing = releases.find(r => r.tag_name === RELEASE_TAG);
    if (existing) return existing;
  } catch {}

  // Create the release
  const release = await githubRequest(
    'POST',
    `/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
    {
      tag_name: RELEASE_TAG,
      name: 'Video Uploads',
      body: 'Permanent storage for uploaded videos.',
      draft: false,
      prerelease: false,
    }
  );
  return release;
}

async function uploadLargeFile(filePath, folder) {
  const fileName = path.basename(filePath);
  const release = await getOrCreateRelease();

  // Upload asset via uploads.github.com (streaming, accepts raw binary)
  const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(`${folder}-${fileName}`)}`);
  const hostname = 'uploads.github.com';
  const urlPath = uploadUrl.replace('https://uploads.github.com', '');

  return new Promise((resolve, reject) => {
    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    const req = https.request({
      hostname,
      path: urlPath,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'portfolio-app',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log(`Video uploaded to GitHub Releases: ${json.name}`);
            // The asset has a permanent browser_download_url
            resolve(json.browser_download_url);
          } else {
            reject(new Error(`Release upload failed: ${json.message || res.statusCode}`));
          }
        } catch {
          reject(new Error(`Upload failed: HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    fileStream.pipe(req);
  });
}

// ---- Public API ----

async function uploadFile(filePath, folder) {
  const stat = fs.statSync(filePath);

  if (stat.size <= MAX_CONTENT_SIZE) {
    return {
      url: await uploadSmallFile(filePath, folder),
      local: false,
    };
  }

  // Large file: use Releases API with streaming
  console.log(`Large file (${(stat.size / 1024 / 1024).toFixed(1)} MB) → GitHub Releases API`);
  return {
    url: await uploadLargeFile(filePath, folder),
    local: false,
  };
}

async function deleteFile(rawUrl) {
  if (!rawUrl || !rawUrl.includes('raw.githubusercontent.com')) return;

  const urlParts = rawUrl.split('raw.githubusercontent.com/');
  if (urlParts.length < 2) return;

  const pathAfterRepo = urlParts[1].split('/').slice(2).join('/');

  try {
    const resp = await githubRequest(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${pathAfterRepo}?ref=${STORAGE_BRANCH}`
    );
    await githubRequest(
      'DELETE',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${pathAfterRepo}`,
      { message: `Delete: ${path.basename(pathAfterRepo)}`, sha: resp.sha, branch: STORAGE_BRANCH }
    );
  } catch (err) {
    console.error('Delete failed:', err.message);
  }
}

module.exports = { uploadFile, deleteFile };
