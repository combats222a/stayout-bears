import common from './common';
import navigation from './navigation';
import actions from './actions';
import language from './language';
import landing from './landing';
import auth from './auth';
import timecalc from './timecalc';
import app from './app';
import tracker from './tracker';

const ru = {
  common,
  navigation,
  actions,
  language,
  landing,
  auth,
  timecalc,
  app,
  tracker,
} as const;

export default ru;
