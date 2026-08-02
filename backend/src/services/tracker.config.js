const BEARS_CONFIG = {
  table: 'bears',
  indexCol: 'bear_index',
  maxIndex: 11,
  respawnMs: 35 * 60 * 1000,
  socketEvent: 'bear:update',
  responseKey: 'bear',
  nounGenitive: 'медведя',   // "Индекс медведя 1-11"
  notFoundLabel: 'Медведь',  // "Медведь не найден"
};

const DRAUGS_CONFIG = {
  table: 'draugs',
  indexCol: 'draug_index',
  maxIndex: 6,
  respawnMs: 25 * 60 * 1000,
  socketEvent: 'draug:update',
  responseKey: 'draug',
  nounGenitive: 'драуга',    // "Индекс драуга 1-6"
  notFoundLabel: 'Драуг',    // "Драуг не найден"
};

module.exports = { BEARS_CONFIG, DRAUGS_CONFIG };
