const service = require('../services/anomaly.service');
const { wrap } = require('./asyncHandler');

module.exports = {
  get: wrap(service.getAnomaly),
  set: wrap(service.setAnomaly),
};
