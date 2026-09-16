import { VIDEO_CATEGORIES } from '../utils/video-categories';

export default function VideoCategoryPicker({ value, onChange, compact = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {VIDEO_CATEGORIES.map((category) => {
        const active = value === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(active ? '' : category)}
            className={`${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-full border font-semibold transition`}
            style={active
              ? { background: '#2563eb', borderColor: '#2563eb', color: '#fff' }
              : { background: '#fff', borderColor: '#dbe3ef', color: '#5f6b7a' }}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

