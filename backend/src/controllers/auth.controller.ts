import * as service from '../services/auth.service';
import { wrap } from './asyncHandler';

export default {
  register: wrap(service.register),
  login: wrap(service.login),
  me: wrap(service.getMe),
  updateProfile: wrap(service.updateProfile),
  deleteAccount: wrap(service.deleteAccount),
};
