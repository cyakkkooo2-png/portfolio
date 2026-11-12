export function isBlackFrame(pixels) {
  let brightness = 0;
  let visiblePixels = 0;
  const count = pixels.length / 4;
  if (!count) return true;
  for (let index = 0; index < pixels.length; index += 4) {
    const value = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
    brightness += value;
    if (value > 24) visiblePixels += 1;
  }
  return brightness / count < 8 && visiblePixels / count < 0.01;
}

// Scan in time order from one second, using small samples to avoid decoding
// full-size canvases until a usable cover is found.
export function captureVideoCover(videoFile, { name = 'video' } = {}) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const remote = typeof videoFile === 'string';
    const objectUrl = remote ? videoFile : URL.createObjectURL(videoFile);
    const sample = document.createElement('canvas');
    sample.width = 64;
    sample.height = 64;
    const context = sample.getContext('2d', { willReadFrequently: true });
    let duration;
    let settled = false;
    let hls;
    const cleanup = () => {
      clearTimeout(timeout);
      video.onloadedmetadata = video.onseeked = video.onerror = null;
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
      if (!remote) URL.revokeObjectURL(objectUrl);
    };
    const fail = (message) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const timeout = setTimeout(() => fail('查找视频封面超时，请手动上传封面'), 60000);
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    if (remote) video.crossOrigin = 'anonymous';
    video.onloadedmetadata = () => {
      duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        fail('无法读取视频时长，请手动上传封面');
        return;
      }
      video.currentTime = Math.min(1, duration / 2);
    };
    video.onseeked = () => {
      if (settled) return;
      try {
        if (!video.videoWidth || !video.videoHeight || !context) {
          fail('视频没有可用画面，请手动上传封面');
          return;
        }
        context.drawImage(video, 0, 0, 64, 64);
        if (isBlackFrame(context.getImageData(0, 0, 64, 64).data)) {
          const lastTime = Math.max(0, duration - Math.min(0.05, duration / 10));
          const nextTime = Math.min(video.currentTime + 0.5, lastTime);
          if (nextTime <= video.currentTime) {
            fail('未找到有画面的视频帧，请手动上传封面');
            return;
          }
          video.currentTime = nextTime;
          return;
        }
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1280 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        video.onseeked = null;
        canvas.toBlob((blob) => {
          if (settled) return;
          if (!blob) {
            fail('自动生成视频封面失败，请手动上传封面');
            return;
          }
          settled = true;
          cleanup();
          const stem = (remote ? name : videoFile.name).replace(/\.[^/.]+$/, '') || 'video';
          resolve(new File([blob], `${stem}-cover.jpg`, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.86);
      } catch {
        fail('浏览器无法生成视频封面，请手动上传封面');
      }
    };
    video.onerror = () => fail('浏览器无法读取该视频，请手动上传封面');
    if (remote && /\.m3u8(?:[?#]|$)/i.test(objectUrl) && !video.canPlayType('application/vnd.apple.mpegurl')) {
      import('hls.js').then(({ default: Hls }) => {
        if (settled) return;
        if (!Hls.isSupported()) { fail('浏览器不支持该视频，请手动上传封面'); return; }
        hls = new Hls({ maxBufferLength: 5, maxMaxBufferLength: 10 });
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) fail('无法读取视频流，请手动上传封面'); });
        hls.loadSource(objectUrl);
        hls.attachMedia(video);
      }).catch(() => fail('无法加载视频，请手动上传封面'));
    } else {
      video.src = objectUrl;
    }
  });
}
