import * as service from '../services/hearts.service';
import { wrap } from './asyncHandler';

export default {
  list: wrap(service.listParticipants),
  create: wrap(service.createParticipant),
  update: wrap(service.updateParticipant),
  remove: wrap(service.deleteParticipant),
  reset: wrap(service.resetParticipants),
};
