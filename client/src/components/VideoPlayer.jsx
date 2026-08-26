import { useEffect, useRef, useState } from 'react';

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
  const hlsRef = useRef(null);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('');
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
    setQualityLevels([]);
    setSelectedQuality('');

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
      // Do not let ABR choose or lower the quality automatically. Wait until the
      // manifest is known, select the highest rendition, then start loading.
      hls = new Hls({ autoStartLoad: false, capLevelToPlayerSize: false });
      hlsRef.current = hls;
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
        hls.currentLevel = highest.index;
        setQualityLevels(levels);
        setSelectedQuality(String(highest.index));
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
      if (hlsRef.current === hls) hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
  }, [videoUrl]);

  const handleQualityChange = (event) => {
    const value = event.target.value;
    const level = Number(value);
    setSelectedQuality(value);
    if (hlsRef.current && Number.isInteger(level)) {
      hlsRef.current.currentLevel = level;
    }
  };

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">暂无视频</span>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} relative`}>
      <video ref={videoRef} controls className={className} title={title} preload="metadata" onLoadedMetadata={onLoadedMetadata} onCanPlay={onCanPlay} onError={onError}>
        您的浏览器不支持视频播放
      </video>
      {qualityLevels.length > 0 && (
        <label className="absolute right-3 top-3 z-10 rounded-md bg-black/75 px-2 py-1 text-sm text-white shadow-lg">
          <span className="mr-2">画质</span>
          <select
            value={selectedQuality}
            onChange={handleQualityChange}
            className="cursor-pointer bg-transparent text-white outline-none"
            aria-label="手动选择视频清晰度"
          >
            {qualityLevels.map((level) => (
              <option key={level.index} value={String(level.index)} className="bg-gray-900 text-white">
                {level.height ? `${level.height}P` : `${Math.round(level.bitrate / 1000)}kbps`}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
