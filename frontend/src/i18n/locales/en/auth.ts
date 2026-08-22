import type { DeepValuesToString } from '../../types';
import type ruAuth from '../ru/auth';

const auth: DeepValuesToString<typeof ruAuth> = {
  backToHome: '← Back to home',
  subtitle: 'Stay Out · Novaya Zemlya',
  tabLogin: 'Log in',
  tabRegister: 'Register',
  nickPlaceholder: 'In-game nickname (visible to other players)',
  emailPlaceholder: 'Email',
  passwordPlaceholder: 'Password',
  nickRequired: 'In-game nickname is required',
  submitLoading: 'Loading...',
  submitLogin: 'Log in',
  submitRegister: 'Create account',
} as const;

export default auth;
