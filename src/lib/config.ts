export const HEALER_OPTIONS = [
  'Holy Priest',
  'Discipline Priest',
  'Restoration Druid',
  'Restoration Shaman',
  'Holy Paladin',
  'Mistweaver Monk',
  'Preservation Evoker',
  'Bard Hunter',
  'DPS',
] as const;

export type Healer = (typeof HEALER_OPTIONS)[number];

export const MARKET_TIMEZONE = 'America/New_York';
export const RESET_HOUR = 3;
export const MARKET_CLOSE_ET = { year: 2026, month: 8, day: 12 } as const;
export const MARKET_END_LABEL = 'Aug 12, 2026';
