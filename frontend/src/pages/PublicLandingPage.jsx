import Header from '../components/Header';
import PromoPage from './PromoPage';

// Публичная стартовая страница для гостей (без логина).
// Раньше неавторизованный посетитель — включая поисковых ботов — сразу
// упирался в форму входа и вообще не видел промо/SEO-контент. Теперь
// промо-страница открыта всем, а вход/регистрация — по кнопке.
//
// Шапка — тот же компонент Header, что и у авторизованных пользователей
// (тот же внешний вид, во всю ширину), но в режиме гостя (user=null): в
// меню только доступные без входа разделы (Промокод, Уровень, FAQ), а
// вместо ника/кнопки «Выйти» — иконка Steam и кнопка «Войти/Зарегистрироваться».
export default function PublicLandingPage({ onLoginClick }) {
  return (
    <>
      <Header user={null} page="promo" onLoginClick={onLoginClick} />

      <div className="public-landing">
        <PromoPage />

        <div className="public-landing-cta">
          <div className="public-landing-cta-text">
            Хочешь также отслеживать медведей, Гору Сияния и таймеры своего клана?
          </div>
          <button className="btn btn-primary" onClick={onLoginClick}>
            Войти / Зарегистрироваться
          </button>
        </div>
      </div>
    </>
  );
}
