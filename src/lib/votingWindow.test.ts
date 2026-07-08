import { describe, it, expect } from 'vitest';
import { getVotingDayKey, getNextResetTime, isMarketClosed } from './votingWindow';

describe('getVotingDayKey', () => {
  it('treats times before 5am ET as belonging to the previous voting day', () => {
    // 2026-01-15 04:59 ET = 2026-01-15 09:59 UTC (EST, UTC-5)
    expect(getVotingDayKey(new Date('2026-01-15T09:59:00Z'))).toBe('2026-01-14');
  });

  it('treats 5am ET and later as the current voting day', () => {
    // 2026-01-15 05:00 ET = 2026-01-15 10:00 UTC (EST, UTC-5)
    expect(getVotingDayKey(new Date('2026-01-15T10:00:00Z'))).toBe('2026-01-15');
  });

  it('is correct across the spring-forward DST transition', () => {
    // 2026-03-09 is the first day of EDT (UTC-4) in the US.
    expect(getVotingDayKey(new Date('2026-03-09T08:59:00Z'))).toBe('2026-03-08');
    expect(getVotingDayKey(new Date('2026-03-09T09:00:00Z'))).toBe('2026-03-09');
  });
});

describe('getNextResetTime', () => {
  it('returns today\'s reset when called before it', () => {
    const result = getNextResetTime(new Date('2026-01-15T09:59:00Z'));
    expect(result.toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });

  it('returns tomorrow\'s reset when called after today\'s', () => {
    const result = getNextResetTime(new Date('2026-01-15T10:00:01Z'));
    expect(result.toISOString()).toBe('2026-01-16T10:00:00.000Z');
  });
});

describe('isMarketClosed', () => {
  it('is false just before the close instant', () => {
    // 2026-08-12 05:00 ET = 2026-08-12 09:00 UTC (EDT, UTC-4)
    expect(isMarketClosed(new Date('2026-08-12T08:59:00Z'))).toBe(false);
  });

  it('is true at and after the close instant', () => {
    expect(isMarketClosed(new Date('2026-08-12T09:00:00Z'))).toBe(true);
  });
});
