// Блок-заглушка для гостей на страницах, где реальный контент привязан
// к аккаунту/клану (Медведи, Сияние, Учёт лута, Таймеры, Клан).
// Гость видит саму страницу и объяснение раздела (см. InfoSpoiler выше),
// но вместо таблиц/форм — этот блок с явным призывом зарегистрироваться.

export default function GuestLock({ icon = '🔒', title, text, onLoginClick }) {
  return (
    <div className="guest-lock">
      <div className="guest-lock-icon">{icon}</div>
      <div className="guest-lock-title">{title}</div>
      <p className="guest-lock-text">{text}</p>
      <button className="btn btn-primary guest-lock-btn" onClick={onLoginClick}>
        Войти / Зарегистрироваться
      </button>
    </div>
  );
}
