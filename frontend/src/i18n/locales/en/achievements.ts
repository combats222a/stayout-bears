import type { AchievementsContent } from '../ru/achievements';

const achievements: AchievementsContent = {
  title: '🏆 Achievements',
  shown: (n, total) => `📋 Showing: ${n} of ${total}`,
  colName: 'Name',
  colDescription: 'Description',
  colExp: 'EXP',
  sortHint: 'Click to sort',
  searchPlaceholder: 'Search by name, description, or category...',
  notFound: 'Nothing found',
  // Достижения — игровые данные Stay Out (имена монстров, локаций,
  // предметов) без официальной английской локализации. Переводить их
  // машинным переводом значило бы придумывать несуществующие названия за
  // разработчиков игры, поэтому они остаются на русском на обеих версиях
  // сайта — с этим примечанием на английской.
  untranslatedNote: 'Achievement names and descriptions are shown in Russian — same as in Stay Out itself, which has no official English localization.',
};

export default achievements;
