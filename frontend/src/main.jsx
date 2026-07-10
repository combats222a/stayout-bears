import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import FaqPage from './pages/FaqPage.jsx';
import LevelPage from './pages/LevelPage.jsx';
import './styles.css';

// Простая проверка адреса без полноценного роутера: страницы FAQ и «Уровень
// персонажа» должны быть доступны по отдельным URL (/faq, /level) как
// незарегистрированным пользователям, так и поисковым ботам, независимо от
// состояния авторизации в приложении. Проверяется только один раз при
// первой загрузке (жёсткий заход/обновление страницы) — этого достаточно,
// т.к. это чисто публичные SEO-страницы без своей навигации внутри app.
const pathname = window.location.pathname.replace(/\/+$/, '');
const isFaqRoute = pathname === '/faq';
const isLevelRoute = pathname === '/level';

// Остальные разделы (в т.ч. авторизованное приложение) рендерятся внутри
// BrowserRouter — это даёт каждому разделу (Медведи, Сияние, Клан, Учёт
// лута, Таймеры, Промокод, Профиль, Админ) свой собственный путь в адресной
// строке (/bears, /shining, /clan, ...), с историей и поддержкой кнопки
// «назад», как у страницы /level.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isFaqRoute ? (
      <FaqPage />
    ) : isLevelRoute ? (
      <LevelPage standalone />
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>
);
