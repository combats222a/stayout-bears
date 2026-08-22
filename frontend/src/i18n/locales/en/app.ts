import type { DeepValuesToString } from '../../types';
import type ruApp from '../ru/app';

const app: DeepValuesToString<typeof ruApp> = {
  connectionError: 'Could not reach the server',
  connectionErrorHint: 'The server is probably still starting up. No need to log in again — just try once more.',
  retry: 'Retry',
} as const;

export default app;
