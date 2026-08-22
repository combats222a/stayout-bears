import type { DeepValuesToString } from '../../types';
import type ruActions from '../ru/actions';

const actions: DeepValuesToString<typeof ruActions> = {
  login: 'Log in / Sign up',
  logout: 'Log out',
};

export default actions;
