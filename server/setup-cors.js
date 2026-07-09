/**
 * One-time setup: configure CORS on COS bucket for video playback
 */
const COS = require('cos-nodejs-sdk-v5');

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID || 'REDACTED',
  SecretKey: process.env.COS_SECRET_KEY || 'REDACTED',
});

cos.putBucketCors({
  Bucket: 'ccyspace-1451500466',
  Region: 'ap-guangzhou',
  CORSRules: [{
    AllowedOrigin: ['*'],
    AllowedMethod: ['GET', 'HEAD'],
    AllowedHeader: ['*'],
    ExposeHeader: ['Content-Length', 'Content-Type', 'ETag'],
    MaxAgeSeconds: 3600,
  }],
}, (err, data) => {
  if (err) {
    console.error('CORS setup failed:', err.message);
  } else {
    console.log('✅ CORS configured — videos will play in browsers');
  }
});
