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
};

export default achievements;
