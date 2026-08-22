import type { DeepValuesToString } from '../../types';
import type ruLanguage from '../ru/language';

const language: DeepValuesToString<typeof ruLanguage> = {
  switcherLabel: 'Interface language',
  ru: 'Russian',
  en: 'English',
};

export default language;
