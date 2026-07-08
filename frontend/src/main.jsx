import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import FaqPage from './pages/FaqPage.jsx';
import LevelPage from './pages/LevelPage.jsx';
import './styles.css';

// Простая проверка адреса без полноценного роутера: страницы FAQ и «Уровень
// персонажа» должны быть доступны по отдельным URL (/faq, /level) как
// незарегистрированным пользователям, так и поисковым ботам, независимо от
// состояния авторизации в приложении.
const pathname = window.location.pathname.replace(/\/+$/, '');
const isFaqRoute = pathname === '/faq';
const isLevelRoute = pathname === '/level';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isFaqRoute ? <FaqPage /> : isLevelRoute ? <LevelPage standalone /> : <App />}
  </React.StrictMode>
);
