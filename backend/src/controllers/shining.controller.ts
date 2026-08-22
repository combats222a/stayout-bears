import * as service from '../services/shining.service';
import { wrap } from './asyncHandler';

export default {
  get: wrap(service.getShining),
  set: wrap(service.setShining),
};
