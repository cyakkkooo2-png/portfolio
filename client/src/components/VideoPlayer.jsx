export default function VideoPlayer({ src, title }) {
  if (!src) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">暂无视频文件</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-black">
      <video
        src={src}
        controls
        className="w-full max-h-[70vh]"
        title={title}
        preload="metadata"
      >
        您的浏览器不支持视频播放
      </video>
    </div>
  );
}
