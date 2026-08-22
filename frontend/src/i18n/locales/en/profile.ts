import type { DeepValuesToString } from '../../types';
import type ruProfile from '../ru/profile';

const profile: DeepValuesToString<typeof ruProfile> = {
  title: '👤 Profile',
  bothFieldsRequired: 'Both fields are required',
  saved: 'Profile saved!',
  loginLabel: 'Login (for signing in)',
  gameNickLabel: 'In-game nickname (visible to other players)',
  saving: 'Saving...',
  save: 'Save',
  emailPrefix: 'Email:',
  deleteTitle: '🗑️ Delete account',
  deleteDesc: 'Once deleted, all account data will be erased. You can register again with the same login.',
  deleteBtn: 'Delete account',
  deleteConfirmPrefix: 'Type your login',
  deleteConfirmSuffix: 'to confirm:',
  deleting: 'Deleting...',
  confirmDeleteBtn: '✓ Yes, delete',
  cancel: 'Cancel',
  wrongLogin: 'Login does not match',
} as const;

export default profile;
