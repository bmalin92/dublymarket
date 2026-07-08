import { describe, it, expect } from 'vitest';
import { calculateOdds, buildGraphSeries, type VoteRow } from './oddsCalculator';
import { HEALER_OPTIONS } from './config';

describe('calculateOdds', () => {
  it('returns zero percentages for an empty vote list, one entry per option', () => {
    const { total, odds } = calculateOdds([]);
    expect(total).toBe(0);
    expect(odds).toHaveLength(HEALER_OPTIONS.length);
    expect(odds.every((entry) => entry.percentage === 0)).toBe(true);
  });

  it('tallies every vote cast, not just the latest per voter', () => {
    const votes: VoteRow[] = [
      { healer: 'Holy Priest', votedAt: '2026-06-01T12:00:00.000Z' },
      { healer: 'Holy Priest', votedAt: '2026-06-02T12:00:00.000Z' },
      { healer: 'Restoration Druid', votedAt: '2026-06-02T12:00:00.000Z' },
    ];
    const { total, odds } = calculateOdds(votes);
    expect(total).toBe(3);
    const holyPriest = odds.find((entry) => entry.healer === 'Holy Priest')!;
    expect(holyPriest.count).toBe(2);
    expect(holyPriest.percentage).toBeCloseTo((2 / 3) * 100, 5);
  });
});

describe('buildGraphSeries', () => {
  it('returns no points for an empty vote list', () => {
    const { points, seriesNames } = buildGraphSeries([]);
    expect(points).toEqual([]);
    expect(seriesNames).toEqual([]);
  });

  it('builds one point per voting day and includes all 9 healer options', () => {
    const votes: VoteRow[] = [
      { healer: 'Holy Priest', votedAt: '2026-06-01T12:00:00.000Z' },
      { healer: 'Discipline Priest', votedAt: '2026-06-01T12:05:00.000Z' },
      { healer: 'Restoration Druid', votedAt: '2026-06-01T12:10:00.000Z' },
      { healer: 'Restoration Shaman', votedAt: '2026-06-01T12:15:00.000Z' },
      { healer: 'Holy Paladin', votedAt: '2026-06-01T12:20:00.000Z' },
      { healer: 'Mistweaver Monk', votedAt: '2026-06-01T12:25:00.000Z' },
      { healer: 'Bard Hunter', votedAt: '2026-06-02T12:00:00.000Z' },
    ];

    const { points, seriesNames } = buildGraphSeries(votes);

    expect(points).toHaveLength(2);
    expect(points[0].date).toBe('2026-06-01');
    expect(points[1].date).toBe('2026-06-02');
    expect(seriesNames).toHaveLength(HEALER_OPTIONS.length);
    expect(seriesNames).toEqual([...HEALER_OPTIONS]);

    const day2 = points[1];
    const seriesTotal = seriesNames.reduce((sum, name) => sum + Number(day2[name]), 0);
    expect(seriesTotal).toBeCloseTo(100, 1);

    // Cumulative math check: day 1 has 6 votes total (1 each for 6 healers), so
    // Holy Priest = 1/6 * 100 = 16.666...% -> rounds to 16.67. Day 2 adds Bard
    // Hunter's vote, bringing the running total to 7 votes while Holy Priest's
    // own count stays at 1, so its cumulative share drops to 1/7 * 100 =
    // 14.2857...% -> rounds to 14.29.
    expect(points[0]['Holy Priest']).toBe(16.67);
    expect(points[1]['Holy Priest']).toBe(14.29);
  });
});
