import { Link } from 'react-router-dom';

const typeLabels = { video: '🎬 视频', image: '🖼️ 图片', article: '📝 文章' };
const typeColors = {
  video: 'bg-red-100 text-red-700',
  image: 'bg-green-100 text-green-700',
  article: 'bg-blue-100 text-blue-700',
};

export default function WorkCard({ work }) {
  return (
    <Link
      to={`/work/${work.id}`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail area */}
      <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
        {work.type === 'video' && work.file_path ? (
          <video src={work.file_path} className="w-full h-full object-cover" preload="metadata" />
        ) : work.type === 'image' && work.file_path ? (
          <img src={work.file_path} alt={work.title} className="w-full h-full object-cover" />
        ) : work.thumbnail ? (
          <img src={work.thumbnail} alt={work.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl text-gray-300">{work.type === 'video' ? '🎬' : work.type === 'image' ? '🖼️' : '📝'}</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className={`text-xs px-2 py-0.5 rounded-full self-start ${typeColors[work.type]}`}>
          {typeLabels[work.type]}
        </span>
        <h3 className="font-semibold text-gray-800 line-clamp-1">{work.title}</h3>
        {work.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{work.description}</p>
        )}
        {work.tags && work.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {work.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
