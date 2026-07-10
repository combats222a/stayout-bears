import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

// FAQ раньше рендерилась здесь в обход App — жёсткой проверкой pathname
// до монтирования роутера, отдельной страницей со своей урезанной
// шапкой (только лого + «На главную»), без общего Header. Это и вызывало
// разъезд шапки на /faq — там не было ни меню, ни кнопки входа/FAQ.
//
// По той же причине раньше так же обрабатывался и /level — и это ломало
// авторизованных: при F5 на /level их выкидывало из приложения на голую
// публичную страницу без хедера и сессии. Теперь оба раздела рендерятся
// внутри App, где уже известно, залогинен человек или нет, и нужный вид
// (общий Header + контент) выбирается там.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
