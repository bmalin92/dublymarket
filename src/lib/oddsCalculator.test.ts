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

  it('calculates percentages based on the latest vote per unique user', () => {
    const votes: VoteRow[] = [
      { healer: 'Holy Priest', votedAt: '2026-06-01T12:00:00.000Z', deviceId: 'user-A' },
      { healer: 'Restoration Druid', votedAt: '2026-06-01T12:05:00.000Z', deviceId: 'user-B' },
      { healer: 'Holy Priest', votedAt: '2026-06-02T12:00:00.000Z', deviceId: 'user-A' },
    ];
    const { total, odds } = calculateOdds(votes);
    expect(total).toBe(3);
    
    const holyPriest = odds.find((entry) => entry.healer === 'Holy Priest')!;
    const druid = odds.find((entry) => entry.healer === 'Restoration Druid')!;
    const paladin = odds.find((entry) => entry.healer === 'Holy Paladin')!;
    
    expect(holyPriest.count).toBe(1);
    expect(holyPriest.percentage).toBe(50);
    expect(druid.count).toBe(1);
    expect(druid.percentage).toBe(50);
    expect(paladin.count).toBe(0);
    expect(paladin.percentage).toBe(0);
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
      { healer: 'Holy Priest', votedAt: '2026-06-01T12:00:00.000Z', deviceId: 'user-1' },
      { healer: 'Discipline Priest', votedAt: '2026-06-01T12:05:00.000Z', deviceId: 'user-2' },
      { healer: 'Restoration Druid', votedAt: '2026-06-01T12:10:00.000Z', deviceId: 'user-3' },
      { healer: 'Restoration Shaman', votedAt: '2026-06-01T12:15:00.000Z', deviceId: 'user-4' },
      { healer: 'Holy Paladin', votedAt: '2026-06-01T12:20:00.000Z', deviceId: 'user-5' },
      { healer: 'Mistweaver Monk', votedAt: '2026-06-01T12:25:00.000Z', deviceId: 'user-6' },
      { healer: 'Bard Hunter', votedAt: '2026-06-02T12:00:00.000Z', deviceId: 'user-7' },
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

    expect(points[0]['Holy Priest']).toBeCloseTo((1 / 6) * 100, 2);
    expect(points[1]['Holy Priest']).toBeCloseTo((1 / 7) * 100, 2);
  });

  it('tracks user vote updates across multiple days in graph series points correctly', () => {
    const votes: VoteRow[] = [
      { healer: 'Holy Priest', votedAt: '2026-06-01T12:00:00.000Z', deviceId: 'user-A' },
      { healer: 'Restoration Druid', votedAt: '2026-06-01T12:05:00.000Z', deviceId: 'user-B' },
      { healer: 'Mistweaver Monk', votedAt: '2026-06-02T12:00:00.000Z', deviceId: 'user-A' },
    ];

    const { points } = buildGraphSeries(votes);

    expect(points).toHaveLength(2);

    expect(points[0].date).toBe('2026-06-01');
    expect(points[0]['Holy Priest']).toBe(50);
    expect(points[0]['Restoration Druid']).toBe(50);
    expect(points[0]['Mistweaver Monk']).toBe(0);

    expect(points[1].date).toBe('2026-06-02');
    expect(points[1]['Holy Priest']).toBe(0);
    expect(points[1]['Restoration Druid']).toBe(50);
    expect(points[1]['Mistweaver Monk']).toBe(50);
  });
});
