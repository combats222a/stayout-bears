import type { AdminContent } from '../ru/admin';

const admin: AdminContent = {
  loading: 'Loading...',
  title: '🛡️ Superadmin panel',
  clansHeading: (n) => `Clans (${n})`,
  ownerLabel: (nick) => `Owner: ${nick}`,
  resetBears: '↺ Reset bears',
  deleteBtn: '🗑️ Delete',
  membersCount: (n) => `👥 ${n} members`,
  bearsDeadCount: (dead, total) => `💀 ${dead}/${total} bears dead`,
  usersHeading: (n) => `Users (${n})`,
  colNick: 'Nickname',
  colEmail: 'Email',
  colClan: 'Clan',
  colRights: 'Role',
  noClan: '—',
  superadminBadge: '🛡️ Superadmin',
  playerBadge: 'Player',
  revokeRights: 'Revoke rights',
  grantRights: 'Grant rights',
  confirmDeleteClan: (name) => `Delete clan "${name}"? All timers will be reset.`,
};

export default admin;
