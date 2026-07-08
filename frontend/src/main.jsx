import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import FaqPage from './pages/FaqPage.jsx';
import './styles.css';

// Простая проверка адреса без полноценного роутера: страница FAQ должна быть
// доступна по отдельному URL (/faq) как незарегистрированным пользователям,
// так и поисковым ботам, независимо от состояния авторизации в приложении.
const isFaqRoute = window.location.pathname.replace(/\/+$/, '') === '/faq';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isFaqRoute ? <FaqPage /> : <App />}
  </React.StrictMode>
);
