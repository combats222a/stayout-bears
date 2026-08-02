const service = require('../services/hearts.service');
const { wrap } = require('./asyncHandler');

module.exports = {
  list: wrap(service.listParticipants),
  create: wrap(service.createParticipant),
  update: wrap(service.updateParticipant),
  remove: wrap(service.deleteParticipant),
  reset: wrap(service.resetParticipants),
};
