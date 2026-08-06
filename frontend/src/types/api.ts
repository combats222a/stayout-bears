// Соответствует реальному поведению utils/api.js на момент написания:
// backend при ошибке отвечает { error: string }, а сетевые/холодный-старт
// сбои utils/api.js заворачивает в Error с доп. полями isNetworkError/status.

export interface ApiErrorResponse {
  error: string;
}

export interface ApiError extends Error {
  status?: number;
  isNetworkError?: boolean;
}
