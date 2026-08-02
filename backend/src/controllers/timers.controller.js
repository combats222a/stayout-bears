const service = require('../services/timers.service');
const { wrap } = require('./asyncHandler');

module.exports = {
  list: wrap(service.listTimers),
  create: wrap(service.createTimer),
  update: wrap(service.updateTimer),
  reorder: wrap(service.reorderTimers),
  reset: wrap(service.resetTimer),
  clear: wrap(service.clearTimer),
  remove: wrap(service.deleteTimer),
};
