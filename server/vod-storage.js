const { VodUploadClient, VodUploadRequest } = require('vod-node-sdk');
const tencentcloud = require('tencentcloud-sdk-nodejs-vod');

const VodApiClient = tencentcloud.vod.v20180717.Client;
const SINGLE_TRANSCODE_TEMPLATE_NAME = 'ccyspace-single-6000k';
const SINGLE_TRANSCODE_BITRATE = 6000;
let apiClient = null;
let singleTranscodeTemplateId = null;

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

async function getSingleTranscodeTemplateId() {
  const configuredId = Number(process.env.TENCENT_VOD_TRANSCODE_TEMPLATE_ID || 0);
  if (Number.isInteger(configuredId) && configuredId > 0) return configuredId;
  if (singleTranscodeTemplateId) return singleTranscodeTemplateId;

  const existing = await getApiClient().DescribeTranscodeTemplates({
    SubAppId: subAppId(),
    Type: 'Custom',
    ContainerType: 'Video',
    TEHDType: 'Common',
    Limit: 100,
  });
  const template = (existing.TranscodeTemplateSet || []).find((item) => (
    item.Name === SINGLE_TRANSCODE_TEMPLATE_NAME
    && item.Container === 'mp4'
    && Number(item.VideoTemplate?.Bitrate) === SINGLE_TRANSCODE_BITRATE
  ));
  if (template) {
    singleTranscodeTemplateId = Number(template.Definition);
    return singleTranscodeTemplateId;
  }

  const created = await getApiClient().CreateTranscodeTemplate({
    SubAppId: subAppId(),
    Name: SINGLE_TRANSCODE_TEMPLATE_NAME,
    Comment: 'CCY SPACE single MP4 output at 6000 Kbps',
    Container: 'mp4',
    RemoveVideo: 0,
    RemoveAudio: 0,
    VideoTemplate: {
      Codec: 'libx264',
      Bitrate: SINGLE_TRANSCODE_BITRATE,
      Fps: 0,
      ResolutionAdaptive: 'open',
      Width: 0,
      Height: 0,
      FillType: 'black',
    },
    AudioTemplate: {
      Codec: 'libfdk_aac',
      Bitrate: 128,
      SampleRate: 48000,
      AudioChannel: 2,
    },
  });
  singleTranscodeTemplateId = Number(created.Definition);
  return singleTranscodeTemplateId;
}

async function requestSingleTranscode(fileId) {
  const definition = await getSingleTranscodeTemplateId();
  return getApiClient().ProcessMedia({
    FileId: String(fileId),
    SubAppId: subAppId(),
    MediaProcessTask: {
      TranscodeTaskSet: [{ Definition: definition }],
    },
    TasksNotifyMode: 'None',
    SessionId: `ccyspace-single-6000-${String(fileId)}`.slice(0, 50),
  });
}

async function getSingleTranscodeUrl(fileId) {
  const definition = await getSingleTranscodeTemplateId();
  const result = await getApiClient().DescribeMediaInfos({
    FileIds: [String(fileId)],
    SubAppId: subAppId(),
    Filters: ['transcodeInfo'],
  });
  const streams = result.MediaInfoSet?.[0]?.TranscodeInfo?.TranscodeSet || [];
  return streams.find((item) => Number(item.Definition) === definition && item.Url)?.Url || '';
}

async function syncRequestedTranscodes(db) {
  if (!isConfigured()) return;
  const works = db.getWorks().filter((work) => (
    work.type === 'video'
    && work.vod_file_id
    && work.vod_transcode_profile === 'single-6000'
    && work.vod_transcode_requested
    && work.vod_transcode_status === 'processing'
  ));

  for (const work of works) {
    try {
      const transcodedUrl = await getSingleTranscodeUrl(work.vod_file_id);
      if (transcodedUrl) db.updateWork(work.id, { file_path: transcodedUrl, vod_transcode_status: 'ready' });
    } catch (err) {
      console.error(`VOD single transcode status check failed for ${work.vod_file_id}:`, err.message);
    }
  }
}

function startTranscodeStatusSync(db) {
  const run = async () => {
    try {
      await syncRequestedTranscodes(db);
    } catch (err) {
      console.error('VOD single transcode status check failed:', err.message);
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
  requestSingleTranscode,
  getSingleTranscodeUrl,
  startTranscodeStatusSync,
};
