import Header from '../components/Header';
import PromoPage from './PromoPage';

// Публичная стартовая страница для гостей (без логина).
// Раньше неавторизованный посетитель — включая поисковых ботов — сразу
// упирался в форму входа и вообще не видел промо/SEO-контент. Теперь
// промо-страница открыта всем, а вход/регистрация — по кнопке.
//
// Шапка — тот же компонент Header, что и у авторизованных пользователей:
// то же меню целиком (в режиме гостя, user=null, клик по закрытому
// разделу просто открывает форму входа), а вместо ника/кнопки «Выйти» —
// кнопка «Войти/Зарегистрироваться».
export default function PublicLandingPage({ onLoginClick, onNavigate, menuOpen, setMenuOpen }) {
  return (
    <>
      <Header
        user={null}
        page="promo"
        onNavigate={onNavigate}
        onLoginClick={onLoginClick}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

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
