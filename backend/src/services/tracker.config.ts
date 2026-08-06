export interface TrackerConfig {
  table: 'bears' | 'draugs';
  indexCol: 'bear_index' | 'draug_index';
  maxIndex: number;
  respawnMs: number;
  socketEvent: 'bear:update' | 'draug:update';
  responseKey: 'bear' | 'draug';
  nounGenitive: string;  // "Индекс медведя 1-11"
  notFoundLabel: string; // "Медведь не найден"
}

export const BEARS_CONFIG: TrackerConfig = {
  table: 'bears',
  indexCol: 'bear_index',
  maxIndex: 11,
  respawnMs: 35 * 60 * 1000,
  socketEvent: 'bear:update',
  responseKey: 'bear',
  nounGenitive: 'медведя',
  notFoundLabel: 'Медведь',
};

export const DRAUGS_CONFIG: TrackerConfig = {
  table: 'draugs',
  indexCol: 'draug_index',
  maxIndex: 6,
  respawnMs: 25 * 60 * 1000,
  socketEvent: 'draug:update',
  responseKey: 'draug',
  nounGenitive: 'драуга',
  notFoundLabel: 'Драуг',
};
