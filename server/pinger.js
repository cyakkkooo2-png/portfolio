// Self-pinger: keeps Railway awake by pinging itself every 4 minutes
const https = require('https');

const SITE_URL = process.env.PING_URL || 'https://portfolio-production-913f.up.railway.app';

function ping() {
  https.get(SITE_URL + '/api/health', (res) => {
    const now = new Date().toLocaleTimeString('zh-CN');
    res.on('data', () => {});
    res.on('end', () => console.log(`[${now}] Ping: ${res.statusCode}`));
  }).on('error', (e) => console.log(`[${new Date().toLocaleTimeString('zh-CN')}] Ping failed: ${e.message}`));
}

// Ping immediately, then every 4 minutes
ping();
setInterval(ping, 4 * 60 * 1000);
console.log('Self-pinger started, pinging every 4 minutes...');
