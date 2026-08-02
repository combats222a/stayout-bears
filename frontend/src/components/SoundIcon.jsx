// Компактная line-иконка звука (вкл/выкл), сделана под общий стиль
// проекта — тонкий контур, currentColor, без emoji.
export default function SoundIcon({ on, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      {on ? (
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      ) : (
        <path d="M15.5 9.5 20 14M20 9.5l-4.5 4.5" />
      )}
    </svg>
  );
}
