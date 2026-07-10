const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function checkAuth() {
  return request('/auth/me');
}

export function getWorks(type) {
  const query = type ? `?type=${type}` : '';
  return request(`/works${query}`);
}

export function getWork(id) {
  return request(`/works/${id}`);
}

export function getStats() {
  return request('/stats');
}

export function deleteWork(id) {
  return request(`/works/${id}`, {
    method: 'DELETE',
  });
}

export function uploadWorkWithProgress(formData, { onProgress, method = 'POST', workId = null } = {}) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const url = workId ? `${API_BASE}/works/${workId}` : `${API_BASE}/works`;

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    let lastTime = Date.now();
    let lastLoaded = 0;

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || event.total === 0) return;

      const now = Date.now();
      const seconds = (now - lastTime) / 1000;
      const bytesDiff = event.loaded - lastLoaded;
      lastLoaded = event.loaded;
      lastTime = now;

      const bps = seconds > 0 ? bytesDiff / seconds : 0;
      const speed = bps > 1024 * 1024
        ? `${(bps / (1024 * 1024)).toFixed(1)} MB/s`
        : bps > 1024
          ? `${Math.round(bps / 1024)} KB/s`
          : `${Math.round(bps)} B/s`;

      const totalMB = (event.total / (1024 * 1024)).toFixed(1);
      const loadedMB = (event.loaded / (1024 * 1024)).toFixed(1);

      onProgress?.({
        percent: Math.round((event.loaded / event.total) * 100),
        loaded: event.loaded,
        total: event.total,
        speed: `${speed} · ${loadedMB} / ${totalMB} MB`,
      });
    });

    xhr.addEventListener('load', () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        data = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data.error || `上传失败 (${xhr.status})`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('网络错误，上传失败。请检查文件大小或稍后重试。')));
    xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

    xhr.send(formData);
  });
}

export function createWork(formData) {
  return uploadWorkWithProgress(formData, { method: 'POST' });
}

export function updateWork(id, formData) {
  return uploadWorkWithProgress(formData, { method: 'PUT', workId: id });
}
