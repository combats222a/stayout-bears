export interface ClanContent {
  roleLeader: string;
  roleDeputy: string;
  roleMember: string;
  transferTitle: string;
  transferLabel: string;
  transferDeputyTag: string;
  transferNoOthers: string;
  transferWarn: string;
  transferCancel: string;
  transferConfirm: string;
  pageTitle: string;
  guestLockTitle: string;
  guestLockText: string;
  createTitle: string;
  createPlaceholder: string;
  createBtn: string;
  joinTitle: string;
  joinBtn: string;
  disbandConfirm: string;
  leaveConfirm: string;
  kickConfirm: (nick: string) => string;
  banConfirm: (nick: string) => string;
  unbanConfirm: (nick: string) => string;
  assignDeputyConfirm: (nick: string) => string;
  removeDeputyConfirm: (nick: string) => string;
  refreshCodeConfirm: string;
  clanTagline: string;
  transferLeadershipBtn: string;
  disbandBtn: string;
  leaveBtn: string;
  renameTitle: string;
  renameSave: string;
  renameCancel: string;
  inviteCodeLabel: string;
  copyBtn: string;
  copiedBtn: string;
  refreshCodeBtn: string;
  refreshCodeTitle: string;
  membersTitle: string;
  banListBtn: (n: number) => string;
  youTag: string;
  removeDeputyTitle: string;
  assignDeputyTitle: string;
  removeDeputyBtn: string;
  assignDeputyBtn: string;
  kickTitle: string;
  kickBtn: string;
  banTitle: string;
  banBtn: string;
  bannedTitle: string;
  unbanBtn: string;
}

const clan: ClanContent = {
  roleLeader: 'Лидер',
  roleDeputy: 'Зам лидера',
  roleMember: 'Соклан',
  transferTitle: '❄️ Передать лидерство',
  transferLabel: 'Выбери нового лидера группировки',
  transferDeputyTag: 'Зам',
  transferNoOthers: 'В клане нет других участников',
  transferWarn: '⚠️ После передачи ты станешь обычным сокланом',
  transferCancel: 'Отмена',
  transferConfirm: 'Передать ❄️',
  pageTitle: '🐻 Группировка',
  guestLockTitle: 'Создай клан или вступи по коду',
  guestLockText: 'Создание группировки и вступление по коду приглашения доступны после регистрации — это займёт меньше минуты.',
  createTitle: '🏔️ Создать группировку',
  createPlaceholder: 'Название группировки',
  createBtn: 'Создать',
  joinTitle: '❄️ Вступить по коду',
  joinBtn: 'Вступить',
  disbandConfirm: 'Расформировать группировку?',
  leaveConfirm: 'Выйти из группировки?',
  kickConfirm: (nick) => `Исключить ${nick} из группировки?`,
  banConfirm: (nick) => `Заблокировать ${nick}? Они не смогут снова вступить в группировку.`,
  unbanConfirm: (nick) => `Разблокировать ${nick}?`,
  assignDeputyConfirm: (nick) => `Назначить ${nick} замом лидера?`,
  removeDeputyConfirm: (nick) => `Снять ${nick} с должности зама?`,
  refreshCodeConfirm: 'Сменить код приглашения? Старый код перестанет работать.',
  clanTagline: 'Группировка охотников на медведей',
  transferLeadershipBtn: '❄️ Передать лидерство',
  disbandBtn: '🗑️ Расформировать',
  leaveBtn: '🚪 Покинуть',
  renameTitle: 'Переименовать группировку',
  renameSave: 'Сохранить',
  renameCancel: 'Отмена',
  inviteCodeLabel: '❄ КОД ПРИГЛАШЕНИЯ',
  copyBtn: '📋 Копировать',
  copiedBtn: '✅ Скопировано',
  refreshCodeBtn: '🔄 Сменить',
  refreshCodeTitle: 'Обновить код приглашения',
  membersTitle: '🌨️ Участники',
  banListBtn: (n) => `🚫 Бан-лист (${n})`,
  youTag: 'ты',
  removeDeputyTitle: 'Снять зама',
  assignDeputyTitle: 'Назначить замом',
  removeDeputyBtn: '🌨️ Снять зама',
  assignDeputyBtn: '🌨️ Зам',
  kickTitle: 'Исключить из группировки',
  kickBtn: '✕ Кик',
  banTitle: 'Заблокировать (кик + бан)',
  banBtn: '🚫 Блок',
  bannedTitle: '🚫 Заблокированные',
  unbanBtn: '✅ Разбанить',
};

export default clan;
