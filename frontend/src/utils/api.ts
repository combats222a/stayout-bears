import type { ApiError } from '../types/api';
import { resolveInitialLocale } from '../i18n';
import type { DeepValuesToString } from '../i18n/types';
import ruApiErrors from '../i18n/locales/ru/apiErrors';
import enApiErrors from '../i18n/locales/en/apiErrors';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('token');
}

// api.ts работает вне React-дерева (нет доступа к useI18n()), поэтому язык
// для сообщений об ошибках сети читаем той же логикой, что и провайдер
// (сохранённый выбор → язык браузера → ru), но заново на каждый вызов —
// человек мог переключить язык уже после того, как этот модуль загрузился.
function apiErrorText(): DeepValuesToString<typeof ruApiErrors> {
  return resolveInitialLocale() === 'en' ? enApiErrors : ruApiErrors;
}

// Render (бесплатный тариф) "усыпляет" бэкенд после простоя — первый запрос
// после сна может не устанавливать соединение ещё 30-50 сек. Чтобы не пугать
// пользователя мгновенной "Нет соединения с сервером", тихо повторяем запрос
// несколько раз с паузой, прежде чем показать ошибку.
const COLD_START_RETRIES = 4;
const COLD_START_DELAY_MS = 4000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(method: string, path: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response | undefined;
  for (let attempt = 0; attempt <= COLD_START_RETRIES; attempt++) {
    try {
      res = await fetch(`${BASE}/api${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      break;
    } catch (e) {
      // Сеть недоступна / сервер не отвечает (например, хостинг ещё "просыпается")
      if (attempt < COLD_START_RETRIES) {
        await sleep(COLD_START_DELAY_MS);
        continue;
      }
      const err: ApiError = new Error(apiErrorText().noConnection);
      err.isNetworkError = true;
      throw err;
    }
  }
  // res гарантированно назначен: либо fetch отработал, либо мы бросили ошибку выше
  res = res as Response;

  let data: any;
  try {
    data = await res.json();
  } catch (e) {
    // Сервер вернул не-JSON (страница ошибки хостинга при холодном старте и т.п.)
    const err: ApiError = new Error(apiErrorText().temporarilyUnavailable);
    err.status = res.status;
    err.isNetworkError = true;
    throw err;
  }

  if (!res.ok) {
    const err: ApiError = new Error(data.error || apiErrorText().serverError);
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
