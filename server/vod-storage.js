const { VodUploadClient, VodUploadRequest } = require('vod-node-sdk');
const tencentcloud = require('tencentcloud-sdk-nodejs-vod');

const VodApiClient = tencentcloud.vod.v20180717.Client;
const ADAPTIVE_TEMPLATE_ID = 10;
let apiClient = null;

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

function getApiClient() {
  if (apiClient) return apiClient;
  const { secretId, secretKey } = credentials();
  if (!secretId || !secretKey) throw new Error('腾讯云点播密钥未配置');
  apiClient = new VodApiClient({
    credential: { secretId, secretKey },
    region: process.env.TENCENT_VOD_API_REGION || 'ap-guangzhou',
    profile: {
      httpProfile: { endpoint: 'vod.tencentcloudapi.com' },
    },
  });
  return apiClient;
}

function subAppId() {
  return Number(process.env.TENCENT_VOD_SUB_APP_ID || 1451500466);
}

async function requestAdaptiveTranscode(fileId) {
  return getApiClient().ProcessMedia({
    FileId: String(fileId),
    SubAppId: subAppId(),
    MediaProcessTask: {
      AdaptiveDynamicStreamingTaskSet: [{ Definition: ADAPTIVE_TEMPLATE_ID }],
    },
    TasksNotifyMode: 'None',
    SessionId: `ccyspace-abr-${String(fileId)}`.slice(0, 50),
  });
}

async function getAdaptivePlaybackUrl(fileId) {
  const result = await getApiClient().DescribeMediaInfos({
    FileIds: [String(fileId)],
    SubAppId: subAppId(),
    Filters: ['adaptiveDynamicStreamingInfo'],
  });
  const streams = result.MediaInfoSet?.[0]?.AdaptiveDynamicStreamingInfo?.AdaptiveDynamicStreamingSet || [];
  const preferred = streams.find((item) => Number(item.Definition) === ADAPTIVE_TEMPLATE_ID && item.Url)
    || streams.find((item) => item.Url);
  return preferred?.Url || '';
}

async function syncAdaptiveWorks(db) {
  if (!isConfigured()) return;
  const works = db.getWorks().filter((work) => work.type === 'video' && work.vod_file_id);

  for (const work of works) {
    if (/\.m3u8(?:$|\?)/i.test(String(work.file_path || ''))) continue;
    try {
      const adaptiveUrl = await getAdaptivePlaybackUrl(work.vod_file_id);
      if (adaptiveUrl) {
        db.updateWork(work.id, { file_path: adaptiveUrl, vod_transcode_status: 'ready' });
        continue;
      }

      if (!work.vod_transcode_requested) {
        await requestAdaptiveTranscode(work.vod_file_id);
        db.updateWork(work.id, {
          vod_transcode_requested: true,
          vod_transcode_status: 'processing',
        });
      }
    } catch (err) {
      if (String(err.code || '').includes('Duplicate')) {
        db.updateWork(work.id, {
          vod_transcode_requested: true,
          vod_transcode_status: 'processing',
        });
      } else {
        console.error(`VOD adaptive sync failed for ${work.vod_file_id}:`, err.message);
      }
    }
  }
}

function startAdaptiveSync(db) {
  const run = async () => {
    try {
      await syncAdaptiveWorks(db);
    } catch (err) {
      console.error('VOD adaptive sync failed:', err.message);
    }
    const timer = setTimeout(run, 60 * 1000);
    timer.unref?.();
  };
  const timer = setTimeout(run, 5 * 1000);
  timer.unref?.();
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

  const appId = subAppId();
  if (Number.isInteger(appId) && appId > 0) request.SubAppId = appId;

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

module.exports = {
  isConfigured,
  uploadFile,
  requestAdaptiveTranscode,
  getAdaptivePlaybackUrl,
  startAdaptiveSync,
};
