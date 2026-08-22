import * as service from '../services/clan.service';
import { wrap } from './asyncHandler';

export default {
  create: wrap(service.createClan),
  join: wrap(service.joinClan),
  leave: wrap(service.leaveClan),
  me: wrap(service.getMyClan),
  kick: wrap(service.kickMember),
  ban: wrap(service.banMember),
  unban: wrap(service.unbanMember),
  transfer: wrap(service.transferLeadership),
  deputy: wrap(service.setDeputy),
  rename: wrap(service.renameClan),
  refreshCode: wrap(service.refreshCode),
};
