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

  // Don't set Content-Type for FormData (browser sets it with boundary)
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

export function createWork(formData) {
  return request('/works', {
    method: 'POST',
    body: formData, // FormData - don't set Content-Type
  });
}

export function updateWork(id, formData) {
  return request(`/works/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

export function deleteWork(id) {
  return request(`/works/${id}`, {
    method: 'DELETE',
  });
}
