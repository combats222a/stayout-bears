import PromoPage from './PromoPage';

const STEAM_URL = 'https://store.steampowered.com/app/1180380/Stay_Out/';

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M11.98 0C5.71 0 .59 4.85.06 11.02l6.44 2.66a3.4 3.4 0 0 1 1.93-.6c.06 0 .12 0 .18.01l2.86-4.15v-.06a4.6 4.6 0 0 1 4.6-4.6 4.6 4.6 0 1 1 0 9.2h-.1l-4.08 2.92c0 .05.01.1.01.15a3.42 3.42 0 0 1-6.79.59L.4 15.03C1.55 20.2 6.31 24 11.98 24c6.63 0 12-5.37 12-12s-5.37-12-12-12zM7.7 18.2l-1.47-.61a2.58 2.58 0 0 0 1.34 1.26 2.6 2.6 0 0 0 3.4-1.4 2.57 2.57 0 0 0-1.4-3.38 2.6 2.6 0 0 0-1.98-.02l1.52.63a1.91 1.91 0 1 1-1.41 3.52zm9.4-9.66a3.07 3.07 0 1 0-6.13 0 3.07 3.07 0 0 0 6.13 0zm-5.36 0a2.3 2.3 0 1 1 4.6 0 2.3 2.3 0 0 1-4.6 0z"/>
    </svg>
  );
}

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

        <div className="public-landing-topbar-links">
          <a className="public-landing-icon-link" href="/level" title="Таблица уровней и опыта">
            Уровни
          </a>
          <a className="public-landing-icon-link" href="/faq" title="Часто задаваемые вопросы">
            FAQ
          </a>
          <a
            className="public-landing-icon-link public-landing-steam-link"
            href={STEAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Stay Out в Steam"
            aria-label="Stay Out в Steam"
          >
            <SteamIcon />
          </a>
          <button className="btn btn-primary" onClick={onLoginClick}>
            Войти / Зарегистрироваться
          </button>
        </div>
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
