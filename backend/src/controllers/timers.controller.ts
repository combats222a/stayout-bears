import * as service from '../services/timers.service';
import { wrap } from './asyncHandler';

export default {
  list: wrap(service.listTimers),
  create: wrap(service.createTimer),
  update: wrap(service.updateTimer),
  reorder: wrap(service.reorderTimers),
  reset: wrap(service.resetTimer),
  clear: wrap(service.clearTimer),
  remove: wrap(service.deleteTimer),
};
