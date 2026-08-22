// Блок-заглушка для гостей на страницах, где реальный контент привязан
// к аккаунту/клану (Медведи, Сияние, Учёт лута, Таймеры, Клан).
// Гость видит саму страницу и объяснение раздела (см. InfoSpoiler выше),
// но вместо таблиц/форм — этот блок с явным призывом зарегистрироваться.

import { useI18n } from '../i18n';

interface GuestLockProps {
  icon?: string;
  title: string;
  text: string;
  onLoginClick: () => void;
}

export default function GuestLock({ icon = '🔒', title, text, onLoginClick }: GuestLockProps) {
  const { t } = useI18n();
  return (
    <div className="guest-lock">
      <div className="guest-lock-icon">{icon}</div>
      <div className="guest-lock-title">{title}</div>
      <p className="guest-lock-text">{text}</p>
      <button className="btn btn-primary btn-shiny guest-lock-btn" onClick={onLoginClick}>
        {t('actions.login')}
      </button>
    </div>
  );
}
