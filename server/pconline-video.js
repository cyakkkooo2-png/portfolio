function pconlineVideoId(url = '') {
  const value = String(url);
  return value.match(/(?:v\.pconline\.com\.cn|pconline\.pcvideo\.com\.cn)\/video-(\d+)\.html/i)?.[1]
    || value.match(/mpconline\.pcvideo\.com\.cn\/(\d+)\.html/i)?.[1]
    || '';
}

function isPconlineVideoUrl(url = '') {
  return Boolean(pconlineVideoId(url));
}

function normalizePconlineVideoUrl(url = '') {
  const id = pconlineVideoId(url);
  return id ? `https://mpconline.pcvideo.com.cn/${id}.html` : url;
}

module.exports = {
  isPconlineVideoUrl,
  normalizePconlineVideoUrl,
  pconlineVideoId,
};
