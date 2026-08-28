import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { uploadVideoDirectToVod, uploadWorkWithProgress } from '../../api';
import ProgressBar from '../../components/ProgressBar';
import StorageBar from '../../components/StorageBar';
import { useAuth } from '../../context/AuthContext';

const TYPES = [
  { key: 'video', label: '视频', icon: '🎬' },
  { key: 'image', label: '图片', icon: '🖼️' },
  { key: 'article', label: '文章', icon: '📄' },
];

function fileNameWithoutExtension(value = '') {
  return String(value).replace(/\.[^/.]+$/, '');
}

// Create a lightweight JPEG cover in the browser. This keeps the server from
// having to decode video files (which is expensive on Railway's small plans).
function captureVideoCover(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(videoFile);
    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Avoid the first frame, which is often black. For very short clips,
      // use the middle of the available duration instead.
      const duration = Number.isFinite(video.duration) ? video.duration : 1;
      video.currentTime = Math.min(1, Math.max(0.05, duration * 0.1));
    };

    video.onseeked = () => {
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      if (!sourceWidth || !sourceHeight) {
        cleanup();
        reject(new Error('视频没有可用画面，无法自动生成封面'));
        return;
      }

      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / sourceWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sourceWidth * scale);
      canvas.height = Math.round(sourceHeight * scale);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        cleanup();
        if (!blob) {
          reject(new Error('自动生成视频封面失败，请手动上传封面'));
          return;
        }
        const stem = videoFile.name.replace(/\.[^/.]+$/, '') || 'video-cover';
        resolve(new File([blob], `${stem}-cover.jpg`, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.86);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('浏览器无法读取该视频，请手动上传封面'));
    };
    video.src = objectUrl;
  });
}

function UtilityUploadCard({ title, description, accept, fieldName, endpoint, buttonText }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function upload() {
    if (!file) {
      setMessage('请先选择文件');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上传失败');
      setFile(null);
      setMessage('上传成功');
    } catch (err) {
      setMessage(err.message || '上传失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <input
        type="file"
        accept={accept}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mt-4 w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
      />
      {file && <p className="mt-2 text-xs text-gray-500">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
      <button type="button" disabled={busy} onClick={upload} className="mt-4 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
        {busy ? '上传中...' : buttonText}
      </button>
      {message && <p className="mt-2 text-xs text-gray-500">{message}</p>}
    </div>
  );
}

function UrlImportCard({ onImported }) {
  const [url, setUrl] = useState('');
  const [importType, setImportType] = useState('auto');
  const [category, setCategory] = useState('');
  const [cover, setCover] = useState(null);
  const [articleContent, setArticleContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function importUrl() {
    if (!url.trim()) {
      setMessage('请先粘贴网页链接');
      return;
    }
    if (importType === 'article' && !cover) {
      setMessage('文章链接需要上传封面');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('url', url.trim());
      if (importType !== 'auto') formData.append('type', importType);
      if (category.trim()) formData.append('category', category.trim());
      if (cover) formData.append('cover', cover);
      if (articleContent.trim()) formData.append('content', articleContent.trim());

      const res = await fetch('/api/works/import-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '导入失败');
      setUrl('');
      setImportType('auto');
      setCategory('');
      setCover(null);
      setArticleContent('');
      setMessage(`导入成功：${data.work?.title || '新作品'}`);
      onImported?.(data.work);
    } catch (err) {
      setMessage(err.message || '导入失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-900">网页链接导入</h2>
          <p className="mt-1 text-sm text-gray-500">粘贴你拥有授权的视频页或文章页链接。文章会导入为站内内容，不嵌入站外页面。</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: 'auto', label: '自动识别' },
              { key: 'video', label: '视频链接' },
              { key: 'article', label: '文章链接' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setImportType(item.key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${importType === item.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-blue-200'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {importType === 'video' && (
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={40}
              placeholder="视频分组，例如：手机评测"
              className="mt-3 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
            />
          )}
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder={importType === 'article' ? 'https://example.com/article.html' : 'https://pconline.pcvideo.com.cn/video-37670.html'}
          />
          {importType === 'article' && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-white/80 p-4">
              <label className="block text-sm font-semibold text-gray-800">文章正文补充（可选）</label>
              <p className="mt-1 text-xs text-gray-500">系统会先自动提取全文。若原网页限制读取、只导入了摘要，可把正文粘贴在这里；标题用“## ”开头会显示为小标题。</p>
              <textarea
                value={articleContent}
                onChange={(event) => setArticleContent(event.target.value)}
                rows={7}
                className="mt-3 w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder={'例如：\n## 第一部分\n这里粘贴文章正文…'}
              />
            </div>
          )}
          <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-white/70 p-4">
            <label className="block text-sm font-semibold text-gray-800">手动封面（可选）</label>
            <p className="mt-1 text-xs text-gray-500">视频可选，文章链接必填。封面会显示在作品卡片和详情页。</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
              className="mt-3 w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100"
            />
            {cover && <p className="mt-2 text-xs text-gray-500">{cover.name} ({(cover.size / 1024 / 1024).toFixed(1)} MB)</p>}
          </div>
        </div>
        <button type="button" disabled={busy} onClick={importUrl} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
          {busy ? '导入中...' : '导入链接'}
        </button>
      </div>
      {message && <p className="mt-3 text-xs text-gray-500">{message}</p>}
    </div>
  );
}

export default function UploadWork() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [type, setType] = useState('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [batchFiles, setBatchFiles] = useState([]);
  const [cover, setCover] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);

  async function handleBatchUpload() {
    setUploading(true);
    setError('');
    setProgress({ percent: 0, speed: 'Preparing batch upload...', fileName: `0/${batchFiles.length}` });

    try {
      for (let index = 0; index < batchFiles.length; index += 1) {
        const videoFile = batchFiles[index];
        const titleFromFile = videoFile.name.replace(/\.[^/.]+$/, '') || videoFile.name;
        const fileName = `(${index + 1}/${batchFiles.length}) ${videoFile.name}`;

        let coverToUpload = cover;
        if (!coverToUpload) {
          setProgress({ percent: Math.round((index / batchFiles.length) * 100), speed: 'Generating video cover...', fileName });
          coverToUpload = await captureVideoCover(videoFile);
        }

        await uploadVideoDirectToVod({
          videoFile,
          coverFile: coverToUpload,
          metadata: {
            title: titleFromFile,
            description,
            content,
            tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
            category: category.trim(),
          },
          onProgress: (uploadProgress) => {
            const percent = Math.round(((index + (uploadProgress.percent / 100)) / batchFiles.length) * 100);
            setProgress({ percent, speed: '直传腾讯云点播', fileName });
          },
        });
      }

      setProgress({ percent: 100, speed: `Uploaded ${batchFiles.length} videos`, fileName: 'Batch complete' });
      setTimeout(() => navigate('/admin'), 900);
    } catch (err) {
      setError(err.message || 'Batch upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (type === 'video' && batchFiles.length > 1) {
      await handleBatchUpload();
      return;
    }
    if (!title.trim()) return setError('请输入标题');
    if (!file) return setError('请选择文件');

    setUploading(true);
    setError('');
    const fileName = file?.name || title;
    setProgress({ percent: 0, speed: '', fileName });

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('content', content);
      formData.append('tags', JSON.stringify(tags.split(',').map((tag) => tag.trim()).filter(Boolean)));
      formData.append('category', type === 'video' ? category.trim() : '');
      if (file) formData.append(type === 'video' ? 'video' : type === 'image' ? 'image' : 'document', file);
      let coverToUpload = cover;
      if (type === 'video' && !cover) {
        setProgress({ percent: 0, speed: '正在自动生成视频封面…', fileName });
        coverToUpload = await captureVideoCover(file);
      }
      if (coverToUpload) formData.append('cover', coverToUpload);

      if (type === 'video') {
        await uploadVideoDirectToVod({
          videoFile: file,
          coverFile: coverToUpload,
          metadata: {
            title: title.trim(),
            description,
            content,
            tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
            category: category.trim(),
          },
          onProgress: (p) => {
            setProgress({ percent: p.percent, speed: '直传腾讯云点播', fileName });
          },
        });
      } else {
        await uploadWorkWithProgress(formData, {
          method: 'POST',
          onProgress: (p) => {
            setProgress({ percent: p.percent, speed: p.speed || '', fileName });
          },
        });
      }

      setProgress({ percent: 100, speed: '', fileName });
      setTimeout(() => navigate('/admin'), 500);
    } catch (err) {
      setError(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="h-16 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-black text-gray-900 no-underline" style={{ fontFamily: "'Playfair Display', serif" }}>
            CCY<span className="text-orange-500">.</span>SPACE
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="rounded-full border border-gray-200 px-4 py-2 text-gray-600 no-underline hover:bg-gray-50">← 返回首页</Link>
            <Link to="/admin" className="rounded-full bg-orange-500 px-5 py-2 font-bold text-white no-underline">⚙ 管理后台</Link>
            <button type="button" onClick={handleLogout} className="font-medium text-gray-700 hover:text-gray-950">退出</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <p className="mb-6 text-center text-sm text-gray-500">上传视频、图片、文章、简历和关于我图片到你的空间</p>

        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
          <StorageBar />
        </div>

        <UrlImportCard onImported={() => setTimeout(() => navigate('/admin'), 900)} />

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <UtilityUploadCard
            title="简历上传"
            description="支持 PDF、Word、压缩包或图片，会显示在联系区附件。"
            accept=".pdf,.doc,.docx,.zip,.jpg,.png"
            fieldName="file"
            endpoint="/api/contact/resume"
            buttonText="上传简历"
          />
          <UtilityUploadCard
            title="关于我图片"
            description="上传后会显示在首页“关于我”左侧。"
            accept="image/*"
            fieldName="image"
            endpoint="/api/theme/about-image"
            buttonText="上传关于我图片"
          />
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-bold text-gray-900">作品上传</h2>
          <p className="mb-5 text-sm text-gray-500">上传视频、图片或文章。视频会直传腾讯云点播，并只生成一个 6000kbps 播放版本，不再生成多档清晰度。</p>

          {error && <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <label className="mb-2 block text-sm font-medium text-gray-700">类型</label>
          <div className="mb-5 flex gap-3">
            {TYPES.map((item) => (
              <button key={item.key} type="button" onClick={() => { setType(item.key); setFile(null); setBatchFiles([]); }} className={`rounded-lg border px-5 py-2 text-sm font-semibold transition ${type === item.key ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">标题 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder={type === 'video' && batchFiles.length > 1 ? '批量上传时，自动使用每个视频的文件名' : '输入标题'} required={!(type === 'video' && batchFiles.length > 1)} disabled={type === 'video' && batchFiles.length > 1} />
              {type === 'video' && batchFiles.length > 1 && <p className="mt-1 text-xs text-gray-500">批量上传会使用每个文件名作为标题，之后可以在后台逐个修改。</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} placeholder="简短描述..." />
            </div>

            {type && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{type === 'video' ? '视频文件 *' : type === 'image' ? '图片文件 *' : '文章文档 *'}</label>
                <p className="mb-2 text-xs text-gray-500">{type === 'article' ? '支持 PDF、Word、TXT 或 Markdown 文档；正文会作为文档保存在作品中。' : ''}</p>
                <input type="file" multiple={type === 'video'} accept={type === 'video' ? 'video/*' : type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt,.md'} onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setFile(selected[0] || null);
                  setBatchFiles(type === 'video' ? selected : []);
                  if (type === 'video' && selected.length === 1) setTitle(fileNameWithoutExtension(selected[0].name));
                }} className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
                {type === 'video' && <p className="mt-1 text-xs text-gray-500">可按住 Ctrl 或 Shift 一次选择多个视频；系统会按顺序上传。</p>}
                {batchFiles.length > 1 ? <p className="mt-1 text-xs font-medium text-blue-600">已选择 {batchFiles.length} 个视频，将自动以文件名作为标题。</p> : file && <p className="mt-1 text-xs text-gray-500">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">封面图（可选）</label>
              {type === 'video' && <p className="mb-2 text-xs text-gray-500">未上传封面时，会自动截取视频约第 1 秒的画面作为封面。</p>}
              <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
            </div>


            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">标签（逗号分隔）</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="设计, UI, 插画" />
            </div>

            {type === 'video' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">视频分组（可选）</label>
                <input value={category} maxLength={40} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="例如：手机评测、旅行记录、Vlog" />
                <p className="mt-1 text-xs text-gray-500">填写后，前台“视频”板块会自动出现这个分组。</p>
              </div>
            )}

            {uploading && progress && <ProgressBar percent={progress.percent} fileName={progress.fileName} speed={progress.speed} />}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={uploading} className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                {uploading ? '上传中...' : '上传作品'}
              </button>
              <button type="button" onClick={() => navigate('/admin')} className="rounded-lg bg-gray-100 px-7 py-3 font-semibold text-gray-600 transition hover:bg-gray-200">取消</button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
