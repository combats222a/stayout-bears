// Иконки категорий достижений — полностью свои, нарисованы как inline SVG
// (не подгружаются с so-wiki или другого стороннего сайта). Стилизованы
// под тёмную "сталкерскую" тему сайта: плашка + пиктограмма + акцентная рамка.
// Один SVG на категорию — так все 300+ достижений визуально сгруппированы
// по смыслу, а не остаются безликими одинаковыми квадратами.

const CATEGORY_STYLE = {
  'События':              { bg: '#3a2a10', fg: '#e3a83b', glyph: 'star' },
  'Истории':              { bg: '#1c2a3a', fg: '#5fa8e0', glyph: 'book' },
  'Артефакты':            { bg: '#2a1c3a', fg: '#b06fe0', glyph: 'gem' },
  'Исследование':         { bg: '#173225', fg: '#4fcf8a', glyph: 'compass' },
  'Торговля':             { bg: '#3a3010', fg: '#e0c23b', glyph: 'coin' },
  'Создание предметов':   { bg: '#2a2418', fg: '#d99a4e', glyph: 'hammer' },
  'Лечение':              { bg: '#1c3a2e', fg: '#4ed9a0', glyph: 'cross' },
  'Нарушения':            { bg: '#3a1c1c', fg: '#e05656', glyph: 'ban' },
  'Убийство сталкеров':   { bg: '#3a1414', fg: '#e04a4a', glyph: 'skull' },
  'Убийство противников': { bg: '#301a1a', fg: '#c85a5a', glyph: 'claw' },
  'Выживание':            { bg: '#1c3020', fg: '#5fcf7a', glyph: 'fire' },
  'Ремонт':               { bg: '#242424', fg: '#9aa0a6', glyph: 'wrench' },
  'Арена':                { bg: '#3a1c30', fg: '#d158b0', glyph: 'swords' },
  'Захваты':              { bg: '#301c1c', fg: '#d1663f', glyph: 'flag' },
  'Группировка':          { bg: '#1c2438', fg: '#5f7fe0', glyph: 'shield' },
  'Зарядка':              { bg: '#30300f', fg: '#d9d13b', glyph: 'bolt' },
  'Смерть':               { bg: '#181818', fg: '#6e7681', glyph: 'skull2' },
  'Страдания':            { bg: '#2a2010', fg: '#c99a4e', glyph: 'egg' },
};

const DEFAULT_STYLE = { bg: '#20242c', fg: '#8b93a1', glyph: 'star' };

function Glyph({ type, color }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'star':
      return <path {...p} d="M12 3l2.2 5.2L20 9l-4.2 3.9L17 19l-5-3.2L7 19l1.2-6.1L4 9l5.8-.8z" />;
    case 'book':
      return <><path {...p} d="M4 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5z" /><path {...p} d="M12 6v13" /></>;
    case 'gem':
      return <path {...p} d="M6 9l6-5 6 5-6 11z M6 9h12" />;
    case 'compass':
      return <><circle cx="12" cy="12" r="8" {...p} /><path {...p} d="M14.5 9.5L11 11l-1.5 3.5L13 13z" fill={color} stroke="none" /></>;
    case 'coin':
      return <><circle cx="12" cy="12" r="8" {...p} /><path {...p} d="M9.5 14.3c.4.9 1.3 1.4 2.5 1.4 1.6 0 2.7-.8 2.7-2s-1-1.7-2.7-2c-1.7-.3-2.7-.8-2.7-2s1.1-2 2.7-2c1.2 0 2.1.5 2.5 1.4" /><path {...p} d="M12 7v10" /></>;
    case 'hammer':
      return <><path {...p} d="M14.5 6.5l3 3-2 2-3-3z" /><path {...p} d="M15.5 9.5L6 19l-2-2 9.5-9.5" /></>;
    case 'cross':
      return <path {...p} d="M12 5v14M5 12h14" />;
    case 'ban':
      return <><circle cx="12" cy="12" r="8" {...p} /><path {...p} d="M6.5 6.5l11 11" /></>;
    case 'skull':
      return <><path {...p} d="M12 4c-4 0-6.5 2.8-6.5 6.3 0 2.4 1.2 3.9 2 4.7v2.5h2.2v-1.6h4.6v1.6H16.5v-2.5c.8-.8 2-2.3 2-4.7C18.5 6.8 16 4 12 4z" /><circle cx="9.3" cy="10.5" r="1.1" fill={color} stroke="none" /><circle cx="14.7" cy="10.5" r="1.1" fill={color} stroke="none" /></>;
    case 'claw':
      return <><path {...p} d="M6 6l3.5 12M11 5l2 12.5M16 6l2.5 11" /></>;
    case 'fire':
      return <path {...p} d="M12 3c1 3-2 4-2 7a4 4 0 108 0c0-2-1-2.5-1.5-3.5.7 2-1 3-1 3-.3-2.5-1.5-3-1.5-6.5-1 1.5-2 2-2 4 0-1.5.5-3 0-4z" />;
    case 'wrench':
      return <path {...p} d="M17.5 6.5a3.5 3.5 0 01-4.6 4.6L7 17l-2-2 5.9-5.9a3.5 3.5 0 014.6-4.6l-2.3 2.3 1.4 1.4z" />;
    case 'swords':
      return <><path {...p} d="M5 19L15 9l2-4-4 2L3 17z" /><path {...p} d="M19 19L9 9 7 5l4 2 10 10z" /></>;
    case 'flag':
      return <><path {...p} d="M6 4v16" /><path {...p} d="M6 5c3-1.5 5 1.5 8 0v7c-3 1.5-5-1.5-8 0z" /></>;
    case 'shield':
      return <path {...p} d="M12 4l7 2.5v5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5v-5z" />;
    case 'bolt':
      return <path {...p} d="M13 3L6 13h5l-1 8 8-11h-5z" fill={color} fillOpacity=".15" />;
    case 'skull2':
      return <><path {...p} d="M12 4c-4 0-6.5 2.8-6.5 6.3 0 2.4 1.2 3.9 2 4.7v2.5h2.2v-1.6h4.6v1.6H16.5v-2.5c.8-.8 2-2.3 2-4.7C18.5 6.8 16 4 12 4z" /><path {...p} d="M8.5 9.5l1.6 1.6M10.1 9.5L8.5 11.1M13.9 9.5l1.6 1.6M15.5 9.5l-1.6 1.6" /></>;
    case 'egg':
      return <path {...p} d="M12 4c3 3 5 7 5 10a5 5 0 11-10 0c0-3 2-7 5-10z" />;
    default:
      return <circle cx="12" cy="12" r="6" {...p} />;
  }
}

export default function AchievementIcon({ category, size = 40 }) {
  const style = CATEGORY_STYLE[category] || DEFAULT_STYLE;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: 'block', borderRadius: 8, background: style.bg, border: `1px solid ${style.fg}55`, flexShrink: 0 }}
    >
      <Glyph type={style.glyph} color={style.fg} />
    </svg>
  );
}

export { CATEGORY_STYLE };
