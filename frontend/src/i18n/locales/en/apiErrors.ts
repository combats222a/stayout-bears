import type { DeepValuesToString } from '../../types';
import type ruApiErrors from '../ru/apiErrors';

const apiErrors: DeepValuesToString<typeof ruApiErrors> = {
  noConnection: 'Could not connect to the server',
  temporarilyUnavailable: 'The server is temporarily unavailable, please try again',
  serverError: 'Server error',
} as const;

export default apiErrors;
