import { HEALER_OPTIONS, type Healer } from './config';
import { getVotingDayKey } from './votingWindow';
import type { OddsEntry, GraphPoint } from './types';

export interface VoteRow {
  healer: string;
  votedAt: string;
}

export function calculateOdds(votes: VoteRow[]): { total: number; odds: OddsEntry[] } {
  const counts = new Map<string, number>();
  for (const option of HEALER_OPTIONS) {
    counts.set(option, 0);
  }
  for (const vote of votes) {
    counts.set(vote.healer, (counts.get(vote.healer) ?? 0) + 1);
  }
  const total = votes.length;
  const odds: OddsEntry[] = HEALER_OPTIONS.map((healer) => {
    const count = counts.get(healer) ?? 0;
    return {
      healer: healer as Healer,
      count,
      percentage: total === 0 ? 0 : (count / total) * 100,
    };
  });
  return { total, odds };
}

export function buildGraphSeries(votes: VoteRow[]): { points: GraphPoint[]; seriesNames: string[] } {
  if (votes.length === 0) {
    return { points: [], seriesNames: [] };
  }

  const sorted = [...votes].sort(
    (a, b) => new Date(a.votedAt).getTime() - new Date(b.votedAt).getTime()
  );

  const dayKeys: string[] = [];
  const seenDays = new Set<string>();
  for (const vote of sorted) {
    const key = getVotingDayKey(new Date(vote.votedAt));
    if (!seenDays.has(key)) {
      seenDays.add(key);
      dayKeys.push(key);
    }
  }

  const { odds: finalOdds } = calculateOdds(votes);
  const topFive = [...finalOdds]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
    .map((entry) => entry.healer as string);
  const topFiveSet = new Set(topFive);

  const points: GraphPoint[] = [];
  const runningVotes: VoteRow[] = [];
  let voteIndex = 0;

  for (const day of dayKeys) {
    while (
      voteIndex < sorted.length &&
      getVotingDayKey(new Date(sorted[voteIndex].votedAt)) === day
    ) {
      runningVotes.push(sorted[voteIndex]);
      voteIndex += 1;
    }
    const { odds } = calculateOdds(runningVotes);
    const point: GraphPoint = { date: day };
    let otherTotal = 0;
    for (const entry of odds) {
      if (topFiveSet.has(entry.healer)) {
        point[entry.healer] = Number(entry.percentage.toFixed(2));
      } else {
        otherTotal += entry.percentage;
      }
    }
    point.Other = Number(otherTotal.toFixed(2));
    points.push(point);
  }

  return { points, seriesNames: [...topFive, 'Other'] };
}
