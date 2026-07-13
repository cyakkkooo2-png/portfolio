/**
 * Tencent COS Storage — pure Node.js HTTP (no SDK dependency)
 */

const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BUCKET = process.env.COS_BUCKET || 'ccyspace-1451500466';
const REGION = process.env.COS_REGION || 'ap-guangzhou';
const SECRET_ID = process.env.COS_SECRET_ID || '';
const SECRET_KEY = process.env.COS_SECRET_KEY || '';
const HOST = `${BUCKET}.cos.${REGION}.myqcloud.com`;

function sha1(data) { return crypto.createHash('sha1').update(data).digest('hex'); }
function hmacSha1(key, data) { return crypto.createHmac('sha1', key).update(data).digest(); }

function sign(method, keyName) {
  const now = Math.floor(Date.now() / 1000);
  const signTime = `${now};${now + 3600}`;
  const httpString = `${method.toLowerCase()}\n${keyName.startsWith('/') ? keyName : '/' + keyName}\n\n\n`;
  const sha1HttpString = sha1(httpString);
  const stringToSign = `sha1\n${signTime}\n${sha1HttpString}\n`;
  const signKey = hmacSha1(SECRET_KEY, signTime);
  const signature = hmacSha1(signKey, stringToSign).toString('hex');
  return `q-sign-algorithm=sha1&q-ak=${SECRET_ID}&q-sign-time=${signTime}&q-key-time=${signTime}&q-header-list=&q-url-param-list=&q-signature=${signature}`;
}

function uploadFile(filePath, folder) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const key = `${folder}/${fileName}`;
    const stat = fs.statSync(filePath);
    // Stream files from disk instead of loading the whole upload into RAM.
    // Railway's small containers can otherwise be killed when a video is sent
    // to COS, even though Multer itself wrote the upload to disk safely.
    const fileStream = fs.createReadStream(filePath);
    const auth = sign('PUT', key);
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const succeed = (url) => {
      if (settled) return;
      settled = true;
      resolve(url);
    };

    const req = https.request({
      hostname: HOST, path: `/${key}`, method: 'PUT',
      headers: { 'Authorization': auth, 'Content-Type': 'application/octet-stream', 'Content-Length': stat.size },
      timeout: 120000,
    }, (res) => {
      res.on('error', fail);
      if (res.statusCode === 200) {
        // Drain the response before resolving so the connection can be reused.
        res.resume();
        res.on('end', () => succeed(`https://${HOST}/${key}`));
      } else {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => fail(new Error(`COS ${res.statusCode}: ${d.substring(0, 100)}`)));
      }
    });
    req.on('error', fail);
    req.setTimeout(120000, () => req.destroy(new Error('Upload timeout')));
    fileStream.on('error', (err) => req.destroy(err));
    fileStream.pipe(req);
  });
}

function deleteFile(url) {
  if (!url?.includes('.myqcloud.com/')) return Promise.resolve();
  const key = url.match(/\.myqcloud\.com\/(.+)$/)?.[1];
  if (!key) return Promise.resolve();
  return new Promise(resolve => {
    https.request({ hostname: HOST, path: `/${key}`, method: 'DELETE', headers: { 'Authorization': sign('DELETE', key) } }, () => resolve())
      .on('error', () => resolve()).end();
  });
}

module.exports = { uploadFile, deleteFile };
