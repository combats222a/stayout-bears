const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Сеть недоступна / сервер не отвечает (например, хостинг ещё "просыпается")
    const err = new Error('Нет соединения с сервером');
    err.isNetworkError = true;
    throw err;
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    // Сервер вернул не-JSON (страница ошибки хостинга при холодном старте и т.п.)
    const err = new Error('Сервер временно недоступен, попробуй ещё раз');
    err.status = res.status;
    err.isNetworkError = true;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data.error || 'Ошибка сервера');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
