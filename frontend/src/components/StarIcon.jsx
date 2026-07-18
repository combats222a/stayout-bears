// Компактная line-иконка "звёздочка" (избранное), сделана под общий стиль
// проекта — тонкий контур, currentColor, без emoji. Заполняется цветом,
// когда точка добавлена в избранное (as on={true}).
export default function StarIcon({ on, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={on ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z" />
    </svg>
  );
}
