import * as service from '../services/anomaly.service';
import { wrap } from './asyncHandler';

export default {
  get: wrap(service.getAnomaly),
  set: wrap(service.setAnomaly),
};
