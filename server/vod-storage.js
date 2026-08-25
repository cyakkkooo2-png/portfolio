const { VodUploadClient, VodUploadRequest } = require('vod-node-sdk');

function credentials() {
  return {
    secretId: process.env.TENCENT_VOD_SECRET_ID || process.env.TENCENT_SECRET_ID || process.env.COS_SECRET_ID || '',
    secretKey: process.env.TENCENT_VOD_SECRET_KEY || process.env.TENCENT_SECRET_KEY || process.env.COS_SECRET_KEY || '',
  };
}

function isConfigured() {
  const { secretId, secretKey } = credentials();
  return Boolean(secretId && secretKey);
}

function uploadFile(mediaFilePath, { coverFilePath = '', mediaName = '' } = {}) {
  const { secretId, secretKey } = credentials();
  if (!secretId || !secretKey) {
    throw new Error('腾讯云点播密钥未配置');
  }

  const client = new VodUploadClient(secretId, secretKey);
  const request = new VodUploadRequest();
  request.MediaFilePath = mediaFilePath;
  if (coverFilePath) request.CoverFilePath = coverFilePath;
  if (mediaName) request.MediaName = mediaName;

  const subAppId = Number(process.env.TENCENT_VOD_SUB_APP_ID || 1451500466);
  if (Number.isInteger(subAppId) && subAppId > 0) request.SubAppId = subAppId;

  const storageRegion = String(process.env.TENCENT_VOD_STORAGE_REGION || '').trim();
  if (storageRegion) request.StorageRegion = storageRegion;

  const apiRegion = process.env.TENCENT_VOD_API_REGION || 'ap-guangzhou';
  return new Promise((resolve, reject) => {
    client.upload(apiRegion, request, (error, data) => {
      if (error) return reject(error);
      resolve({
        url: data.MediaUrl,
        coverUrl: data.CoverUrl || '',
        fileId: data.FileId || '',
      });
    });
  });
}

module.exports = { isConfigured, uploadFile };
