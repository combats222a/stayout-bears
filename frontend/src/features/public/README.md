# features/public/

Публичные/SEO-страницы, не завязанные на конкретную фичу продукта —
сгруппированы вместе, как и планировали в исходной архитектуре:
`PublicLandingPage.jsx`, `FaqPage.jsx`, `LevelPage.jsx`, `TimeCalcPage.jsx`.
Все перенесены как есть, интерфейсы не менялись. `PublicLandingPage.jsx`
импортирует `PromoPage` из `features/promo/` (единственная перекрёстная
ссылка между фичами в этом переносе).
