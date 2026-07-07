export default function FilterBar({ activeType, onTypeChange }) {
  const types = [
    { key: '', label: '全部' },
    { key: 'video', label: '🎬 视频' },
    { key: 'image', label: '🖼️ 图片' },
    { key: 'article', label: '📝 文章' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {types.map(t => (
        <button
          key={t.key}
          onClick={() => onTypeChange(t.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeType === t.key
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
