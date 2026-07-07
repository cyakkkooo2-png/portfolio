export default function ImageGallery({ src, title }) {
  if (!src) {
    return (
      <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">暂无图片</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-gray-100">
      <img
        src={src}
        alt={title}
        className="w-full max-h-[70vh] object-contain cursor-pointer"
        onClick={(e) => {
          // Simple lightbox: open image in new tab
          window.open(src, '_blank');
        }}
      />
    </div>
  );
}
