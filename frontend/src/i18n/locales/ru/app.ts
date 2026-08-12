const app = {
  connectionError: 'Не удалось связаться с сервером',
  connectionErrorHint: 'Сервер, вероятно, ещё запускается. Вход не потребуется — просто попробуй ещё раз.',
  retry: 'Повторить',
} as const;

export default app;
