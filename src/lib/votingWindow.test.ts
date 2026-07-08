import { describe, it, expect } from 'vitest';
import { getVotingDayKey, getNextResetTime, isMarketClosed } from './votingWindow';

describe('getVotingDayKey', () => {
  it('treats times before 3am ET as belonging to the previous voting day', () => {
    // 2026-01-15 02:59 ET = 2026-01-15 07:59 UTC (EST, UTC-5)
    expect(getVotingDayKey(new Date('2026-01-15T07:59:00Z'))).toBe('2026-01-14');
  });

  it('treats 3am ET and later as the current voting day', () => {
    // 2026-01-15 03:00 ET = 2026-01-15 08:00 UTC (EST, UTC-5)
    expect(getVotingDayKey(new Date('2026-01-15T08:00:00Z'))).toBe('2026-01-15');
  });

  it('is correct across the spring-forward DST transition', () => {
    // DST begins 2026-03-08 in the US; 2026-03-09 falls within EDT (UTC-4).
    expect(getVotingDayKey(new Date('2026-03-09T06:59:00Z'))).toBe('2026-03-08');
    expect(getVotingDayKey(new Date('2026-03-09T07:00:00Z'))).toBe('2026-03-09');
  });
});

describe('getNextResetTime', () => {
  it('returns today\'s reset when called before it', () => {
    const result = getNextResetTime(new Date('2026-01-15T07:59:00Z'));
    expect(result.toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });

  it('returns tomorrow\'s reset when called after today\'s', () => {
    const result = getNextResetTime(new Date('2026-01-15T08:00:01Z'));
    expect(result.toISOString()).toBe('2026-01-16T08:00:00.000Z');
  });

  it('is correct across the spring-forward DST transition', () => {
    // Just before 3am ET reset on the spring-forward date itself.
    // 01:59 AM EST = 06:59 UTC, jumping to 03:00 AM EDT = 07:00 UTC.
    const result = getNextResetTime(new Date('2026-03-08T06:59:00Z'));
    expect(result.toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  it('is correct across the fall-back DST transition', () => {
    // Just before 3am ET reset on the fall-back date itself.
    // 02:59 AM EST = 07:59 UTC, 3AM EST = 08:00 UTC.
    const result = getNextResetTime(new Date('2026-11-01T07:59:00Z'));
    expect(result.toISOString()).toBe('2026-11-01T08:00:00.000Z');
  });
});

describe('isMarketClosed', () => {
  it('is false just before the close instant', () => {
    // 2026-08-12 02:59 ET = 2026-08-12 06:59 UTC (EDT, UTC-4)
    expect(isMarketClosed(new Date('2026-08-12T06:59:00Z'))).toBe(false);
  });

  it('is true at and after the close instant', () => {
    // 2026-08-12 03:00 ET = 2026-08-12 07:00 UTC (EDT, UTC-4)
    expect(isMarketClosed(new Date('2026-08-12T07:00:00Z'))).toBe(true);
  });
});
