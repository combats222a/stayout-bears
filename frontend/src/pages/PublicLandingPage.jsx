import PromoPage from './PromoPage';

// Публичная стартовая страница для гостей (без логина).
// Раньше неавторизованный посетитель — включая поисковых ботов — сразу
// упирался в форму входа и вообще не видел промо/SEO-контент. Теперь
// промо-страница открыта всем, а вход/регистрация — по кнопке.
export default function PublicLandingPage({ onLoginClick }) {
  return (
    <div className="public-landing">
      <div className="public-landing-topbar">
        <div className="public-landing-brand">
          <span className="public-landing-logo">🐻‍❄️</span>
          <span className="public-landing-name">Bear Tracker</span>
        </div>
        <button className="btn btn-primary" onClick={onLoginClick}>
          Войти / Зарегистрироваться
        </button>
      </div>

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
  );
}
