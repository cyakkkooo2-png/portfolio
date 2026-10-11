import { useEffect, useRef } from 'react';

export default function VideoPlayer({
  src,
  title,
  className = 'w-full max-h-[70vh]',
  containerClassName = 'rounded-lg overflow-hidden bg-black',
  onLoadedMetadata,
  onCanPlay,
  onError,
  autoPlay = false,
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
  const isHlsSource = /\.m3u8(?:$|\?)/i.test(videoUrl || '');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return undefined;
    let hls = null;
    let cancelled = false;
    async function attachSource() {
      if (!isHlsSource) {
        video.src = videoUrl;
        return;
      }

      const { default: Hls } = await import('hls.js');
      if (cancelled) return;
      if (!Hls.isSupported()) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = videoUrl;
          return;
        }
        onErrorRef.current?.();
        return;
      }
      // Do not let ABR choose or lower the quality automatically. Wait until the
      // manifest is known, select the highest rendition, then start loading.
      hls = new Hls({ autoStartLoad: false, capLevelToPlayerSize: false });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const levels = (data?.levels || [])
          .map((level, index) => ({
            index,
            height: level.height || 0,
            bitrate: level.bitrate || 0,
          }))
          .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);

        if (!levels.length) {
          hls.startLoad();
          return;
        }

        const highest = levels[0];
        // `currentLevel` alone does not control Hls.js's very first fragment.
        // Pin all initial-load selectors before startLoad so the opening seconds
        // cannot come from the lowest rendition used by its bandwidth test.
        hls.startLevel = highest.index;
        hls.loadLevel = highest.index;
        hls.nextLoadLevel = highest.index;
        hls.startLoad();
      });
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
  }, [videoUrl, isHlsSource]);

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">暂无视频</span>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} relative`}>
      <video ref={videoRef} controls autoPlay={autoPlay} playsInline className={className} title={title} preload="metadata" onLoadedMetadata={onLoadedMetadata} onCanPlay={onCanPlay} onError={onError}>
        您的浏览器不支持视频播放
      </video>
    </div>
  );
}
