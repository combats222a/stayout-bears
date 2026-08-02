const service = require('../services/admin.service');
const { wrap } = require('./asyncHandler');

module.exports = {
  getClans: wrap(service.getClansOverview),
  deleteClan: wrap(service.deleteClan),
  resetClanBears: wrap(service.resetClanBears),
  toggleAdmin: wrap(service.toggleAdmin),
};
