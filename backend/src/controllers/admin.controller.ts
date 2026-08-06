import * as service from '../services/admin.service';
import { wrap } from './asyncHandler';

export default {
  getClans: wrap(service.getClansOverview),
  deleteClan: wrap(service.deleteClan),
  resetClanBears: wrap(service.resetClanBears),
  toggleAdmin: wrap(service.toggleAdmin),
};
