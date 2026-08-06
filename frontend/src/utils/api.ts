import type { ApiError } from '../types/api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request(method: string, path: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Сеть недоступна / сервер не отвечает (например, хостинг ещё "просыпается")
    const err: ApiError = new Error('Нет соединения с сервером');
    err.isNetworkError = true;
    throw err;
  }

  let data: any;
  try {
    data = await res.json();
  } catch (e) {
    // Сервер вернул не-JSON (страница ошибки хостинга при холодном старте и т.п.)
    const err: ApiError = new Error('Сервер временно недоступен, попробуй ещё раз');
    err.status = res.status;
    err.isNetworkError = true;
    throw err;
  }

  if (!res.ok) {
    const err: ApiError = new Error(data.error || 'Ошибка сервера');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: unknown) => request('POST', path, body),
  put: (path: string, body?: unknown) => request('PUT', path, body),
  patch: (path: string, body?: unknown) => request('PATCH', path, body),
  delete: (path: string) => request('DELETE', path),
};
