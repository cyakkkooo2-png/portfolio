const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

// Auth
export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function checkAuth() {
  return request('/auth/me');
}

// Works
export function getWorks(type) {
  const query = type ? `?type=${type}` : '';
  return request(`/works${query}`);
}

export function getWork(id) {
  return request(`/works/${id}`);
}

// Storage stats
export function getStats() {
  return request('/stats');
}

export function deleteWork(id) {
  return request(`/works/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Upload with progress tracking via XHR
 */
export function uploadWorkWithProgress(formData, { onProgress, method = 'POST', workId = null } = {}) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    // Upload directly to Railway to avoid Cloudflare body size limits
    const base = 'https://portfolio-production-913f.up.railway.app';
    const url = workId ? `${base}/api/works/${workId}` : `${base}/api/works`;

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Track upload progress
    let lastTime = Date.now();
    let lastLoaded = 0;

    xhr.upload.addEventListener('progress', (e) => {
      if (!e.lengthComputable || e.total === 0) return;

      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000;
      const bytesDiff = e.loaded - lastLoaded;
      lastLoaded = e.loaded;
      lastTime = now;

      // Calculate speed
      const bps = timeDiff > 0 ? bytesDiff / timeDiff : 0;
      let speedStr = '';
      if (bps > 1024 * 1024) {
        speedStr = (bps / (1024 * 1024)).toFixed(1) + ' MB/s';
      } else if (bps > 1024) {
        speedStr = Math.round(bps / 1024) + ' KB/s';
      } else {
        speedStr = Math.round(bps) + ' B/s';
      }

      const totalMB = (e.total / (1024 * 1024)).toFixed(1);
      const loadedMB = ((e.loaded / e.total * parseFloat(totalMB))).toFixed(1);

      onProgress?.({
        percent: Math.round((e.loaded / e.total) * 100),
        loaded: e.loaded,
        total: e.total,
        speed: `${speedStr} · ${loadedMB} / ${totalMB} MB`,
      });
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.error || `上传失败 (${xhr.status})`));
        }
      } catch {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({});
        } else {
          reject(new Error(`上传失败 (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('网络错误，上传失败')));
    xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

    xhr.send(formData);
  });
}

// Simple wrappers (no progress tracking)
export function createWork(formData) {
  return uploadWorkWithProgress(formData, { method: 'POST' });
}

export function updateWork(id, formData) {
  return uploadWorkWithProgress(formData, { method: 'PUT', workId: id });
}
