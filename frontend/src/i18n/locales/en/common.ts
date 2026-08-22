import type { DeepValuesToString } from '../../types';
import type ruCommon from '../ru/common';

// Тип берётся из ru/common.ts (см. src/i18n/types.ts) — если тут забыть
// ключ или добавить лишний, TypeScript укажет на это при сборке.
const common: DeepValuesToString<typeof ruCommon> = {
  loading: 'Loading...',
  appName: 'Bear Tracker',
};

export default common;
