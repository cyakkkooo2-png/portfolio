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
    const body = fs.readFileSync(filePath);
    const auth = sign('PUT', key);

    const req = https.request({
      hostname: HOST, path: `/${key}`, method: 'PUT',
      headers: { 'Authorization': auth, 'Content-Type': 'application/octet-stream', 'Content-Length': stat.size },
      timeout: 120000,
    }, (res) => {
      if (res.statusCode === 200) {
        resolve(`https://${HOST}/${key}`);
      } else {
        let d = ''; res.on('data', c => d += c); res.on('end', () => reject(new Error(`COS ${res.statusCode}: ${d.substring(0, 100)}`)));
      }
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(body); req.end();
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
