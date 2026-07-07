/**
 * GitHub Storage — stores uploaded files in the GitHub repo
 * Files are accessible via raw.githubusercontent.com (permanent, free)
 */
const https = require('https');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_OWNER = 'cyakkkooo2-png';
const REPO_NAME = 'portfolio';
const STORAGE_BRANCH = 'master';
const STORAGE_PATH = 'storage'; // files stored in repo's storage/ folder

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

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          let errMsg = `GitHub API ${res.statusCode}`;
          try {
            const err = JSON.parse(data);
            errMsg = err.message || errMsg;
          } catch {}
          reject(new Error(errMsg));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      const bodyStr = JSON.stringify(body);
      req.write(bodyStr);
    }
    req.end();
  });
}

/**
 * Upload a file to the GitHub repo storage/ folder
 * @param {string} filePath - local file path
 * @param {string} folder - subfolder (images/videos/articles)
 * @returns {Promise<string>} - raw.githubusercontent.com URL
 */
async function uploadFile(filePath, folder) {
  const fs = require('fs');

  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const base64Content = fileBuffer.toString('base64');
  const fileName = path.basename(filePath);
  const githubFilePath = `${STORAGE_PATH}/${folder}/${fileName}`;

  // Check if file already exists (to get sha for update)
  let sha = null;
  try {
    const existing = await githubRequest(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${githubFilePath}?ref=${STORAGE_BRANCH}`
    );
    sha = existing.sha;
  } catch {
    // File doesn't exist yet, that's fine
  }

  const body = {
    message: `Upload: ${folder}/${fileName}`,
    content: base64Content,
    branch: STORAGE_BRANCH,
  };
  if (sha) body.sha = sha;

  await githubRequest(
    'PUT',
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${githubFilePath}`,
    body
  );

  // Return the raw URL
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${STORAGE_BRANCH}/${githubFilePath}`;
}

/**
 * Delete a file from GitHub storage
 * @param {string} rawUrl - the raw.githubusercontent.com URL
 */
async function deleteFile(rawUrl) {
  if (!rawUrl || !rawUrl.includes('raw.githubusercontent.com')) {
    return; // Not a GitHub storage URL, skip
  }

  // Extract path from URL
  // https://raw.githubusercontent.com/cyakkkooo2-png/portfolio/master/storage/images/file.jpg
  const urlParts = rawUrl.split('raw.githubusercontent.com/');
  if (urlParts.length < 2) return;

  const pathAfterRepo = urlParts[1].split('/').slice(2).join('/'); // remove owner/repo

  try {
    const existing = await githubRequest(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${pathAfterRepo}?ref=${STORAGE_BRANCH}`
    );

    await githubRequest(
      'DELETE',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${pathAfterRepo}`,
      {
        message: `Delete: ${path.basename(pathAfterRepo)}`,
        sha: existing.sha,
        branch: STORAGE_BRANCH,
      }
    );
  } catch (err) {
    console.error('Failed to delete GitHub file:', err.message);
  }
}

module.exports = { uploadFile, deleteFile };
