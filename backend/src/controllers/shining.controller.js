const service = require('../services/shining.service');
const { wrap } = require('./asyncHandler');

module.exports = {
  get: wrap(service.getShining),
  set: wrap(service.setShining),
};
