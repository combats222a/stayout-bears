import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import FaqPage from './pages/FaqPage.jsx';
import './styles.css';

// FAQ — единственная страница, у которой нет отдельного состояния "для
// авторизованных": контент один и тот же для всех, поэтому её достаточно
// проверить один раз по адресу до монтирования роутера.
//
// Раньше так же (жёсткой проверкой pathname === '/level') отдельно
// обрабатывался и «Уровень персонажа» — но это ломало авторизованных:
// при обновлении страницы (F5) на /level их выкидывало из приложения на
// голую публичную страницу без хедера и сессии. Теперь /level рендерится
// внутри App — там уже известно, залогинен человек или нет, и нужный вид
// (публичный SEO-вариант или вкладка внутри приложения) выбирается там.
const pathname = window.location.pathname.replace(/\/+$/, '');
const isFaqRoute = pathname === '/faq';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isFaqRoute ? (
      <FaqPage />
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>
);
