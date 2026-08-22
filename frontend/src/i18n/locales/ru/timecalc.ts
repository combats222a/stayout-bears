const timecalc = {
  title: '🧮 Калькулятор времени',
  reset: 'Сбросить',
  subtitle: 'Укажите время — цифрами, без двоеточия, оно проставится само — и на сколько минут его сдвинуть. Если время не трогать, расчёт идёт от текущего момента.',
  timePlaceholder: 'сейчас',
  nowBtn: '🕐 Сейчас',
  subtractAria: 'Отнять',
  addAria: 'Прибавить',
  minutesSuffix: 'мин',
  chipMinutesSuffix: 'мин',
  incomplete: 'Дозаполните время — не хватает цифр',
  invalidTime: '🤔 Такого времени не бывает — проверьте часы и минуты',
  copied: '✓ Скопировано',
  copy: '📋 Копировать',
  nowLabel: 'Сейчас',
} as const;

export default timecalc;
