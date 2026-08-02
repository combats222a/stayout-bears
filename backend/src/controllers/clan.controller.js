const service = require('../services/clan.service');
const { wrap } = require('./asyncHandler');

module.exports = {
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
