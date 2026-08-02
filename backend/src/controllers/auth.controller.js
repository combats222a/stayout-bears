const service = require('../services/auth.service');
const { wrap } = require('./asyncHandler');

module.exports = {
  register: wrap(service.register),
  login: wrap(service.login),
  me: wrap(service.getMe),
  updateProfile: wrap(service.updateProfile),
  deleteAccount: wrap(service.deleteAccount),
};
