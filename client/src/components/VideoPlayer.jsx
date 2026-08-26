import { useEffect, useRef } from 'react';

export default function VideoPlayer({
  src,
  title,
  className = 'w-full max-h-[70vh]',
  containerClassName = 'rounded-lg overflow-hidden bg-black',
  onLoadedMetadata,
  onCanPlay,
  onError,
}) {
  const videoRef = useRef(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const isTencentVod = /^https?:\/\/[^/]+\.(?:vod2\.myqcloud\.com|vod-qcloud\.com|vod\.tencent-cloud\.com)(?:\/|$)/i.test(src || '');
  const videoUrl = src?.startsWith('/uploads/')
    ? src
    : isTencentVod
      ? src
    : /^https?:\/\//i.test(src || '')
      ? `/api/works/proxy-video?url=${encodeURIComponent(src)}`
      : src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return undefined;
    let hls = null;
    let cancelled = false;

    async function attachSource() {
      if (!/\.m3u8(?:$|\?)/i.test(videoUrl)) {
        video.src = videoUrl;
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        return;
      }

      const { default: Hls } = await import('hls.js');
      if (cancelled) return;
      if (!Hls.isSupported()) {
        onErrorRef.current?.();
        return;
      }
      hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) onErrorRef.current?.();
      });
    }

    attachSource().catch(() => onErrorRef.current?.());
    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">暂无视频</span>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <video ref={videoRef} controls className={className} title={title} preload="metadata" onLoadedMetadata={onLoadedMetadata} onCanPlay={onCanPlay} onError={onError}>
        您的浏览器不支持视频播放
      </video>
    </div>
  );
}
