export default function VideoPlayer({ src, title }) {
  const videoUrl = src?.startsWith('/uploads/') ? 'https://portfolio-production-913f.up.railway.app' + src : src;

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">暂无视频</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-black">
      <video src={videoUrl} controls className="w-full max-h-[70vh]" title={title} preload="metadata" crossOrigin="anonymous">
        您的浏览器不支持视频播放
      </video>
    </div>
  );
}
