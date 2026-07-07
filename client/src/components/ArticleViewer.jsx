export default function ArticleViewer({ content, title }) {
  if (!content) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-gray-400">
        暂无文章内容
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm border border-gray-200">
      <article className="prose prose-gray max-w-none">
        {/* Split by double newlines for paragraphs */}
        {content.split('\n\n').map((block, i) => {
          // Check for headers (lines starting with #)
          if (block.startsWith('# ')) {
            return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{block.slice(2)}</h1>;
          }
          if (block.startsWith('## ')) {
            return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{block.slice(3)}</h2>;
          }
          if (block.startsWith('### ')) {
            return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{block.slice(4)}</h3>;
          }
          // Regular paragraph
          return <p key={i} className="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">{block}</p>;
        })}
      </article>
    </div>
  );
}
