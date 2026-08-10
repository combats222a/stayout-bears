import type { DeepValuesToString } from '../../types';
import type ru from '../ru';
import common from './common';
import navigation from './navigation';
import actions from './actions';
import language from './language';

// Форма (ключи) обязана 1:1 совпадать с ru/index.ts — если добавить
// новый namespace в ru и забыть добавить его сюда, TypeScript упадёт с
// ошибкой прямо здесь, а не молча покажет пустые строки на английской
// версии сайта.
const en: DeepValuesToString<typeof ru> = {
  common,
  navigation,
  actions,
  language,
};

export default en;
