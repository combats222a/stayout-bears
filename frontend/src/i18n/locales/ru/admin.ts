export interface AdminContent {
  loading: string;
  title: string;
  clansHeading: (n: number) => string;
  ownerLabel: (nick: string) => string;
  resetBears: string;
  deleteBtn: string;
  membersCount: (n: number) => string;
  bearsDeadCount: (dead: number, total: number) => string;
  usersHeading: (n: number) => string;
  colNick: string;
  colEmail: string;
  colClan: string;
  colRights: string;
  noClan: string;
  superadminBadge: string;
  playerBadge: string;
  revokeRights: string;
  grantRights: string;
  confirmDeleteClan: (name: string) => string;
}

const admin: AdminContent = {
  loading: 'Загрузка...',
  title: '🛡️ Панель суперадмина',
  clansHeading: (n) => `Кланы (${n})`,
  ownerLabel: (nick) => `Владелец: ${nick}`,
  resetBears: '↺ Сбросить медведей',
  deleteBtn: '🗑️ Удалить',
  membersCount: (n) => `👥 ${n} участников`,
  bearsDeadCount: (dead, total) => `💀 ${dead}/${total} медведей мертвы`,
  usersHeading: (n) => `Игроки (${n})`,
  colNick: 'Ник',
  colEmail: 'Email',
  colClan: 'Клан',
  colRights: 'Права',
  noClan: '—',
  superadminBadge: '🛡️ Суперадмин',
  playerBadge: 'Игрок',
  revokeRights: 'Снять права',
  grantRights: 'Дать права',
  confirmDeleteClan: (name) => `Удалить клан «${name}»? Все таймеры будут сброшены.`,
};

export default admin;
