export interface AchievementsContent {
  title: string;
  shown: (n: number, total: number) => string;
  colName: string;
  colDescription: string;
  colExp: string;
  sortHint: string;
  searchPlaceholder: string;
  notFound: string;
  untranslatedNote: string | null;
}

const achievements: AchievementsContent = {
  title: '🏆 Достижения',
  shown: (n, total) => `📋 Показано: ${n} из ${total}`,
  colName: 'Наименование',
  colDescription: 'Описание',
  colExp: 'Опыт',
  sortHint: 'Нажмите, чтобы отсортировать',
  searchPlaceholder: 'Поиск по названию, описанию или категории...',
  notFound: 'Ничего не найдено',
  // На русской версии достижения и так на русском — примечание не нужно.
  untranslatedNote: null,
};

export default achievements;
