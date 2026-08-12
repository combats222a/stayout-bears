import type { DeepValuesToString } from '../../types';
import type ruTimecalc from '../ru/timecalc';

const timecalc: DeepValuesToString<typeof ruTimecalc> = {
  title: '🧮 Time Calculator',
  reset: 'Reset',
  subtitle: 'Enter a time — just digits, no colon needed, it fills in automatically — and how many minutes to shift it by. If you leave the time blank, the calculation starts from the current moment.',
  timePlaceholder: 'now',
  nowBtn: '🕐 Now',
  subtractAria: 'Subtract',
  addAria: 'Add',
  minutesSuffix: 'min',
  chipMinutesSuffix: 'min',
  incomplete: 'Finish entering the time — some digits are missing',
  invalidTime: '🤔 That time doesn\'t exist — check the hours and minutes',
  copied: '✓ Copied',
  copy: '📋 Copy',
  nowLabel: 'Now',
};

export default timecalc;
