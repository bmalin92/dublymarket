import { HEALER_OPTIONS, type Healer } from './config';
import { getGuessingDayKey } from './guessingWindow';
import type { OddsEntry, GraphPoint } from './types';

export interface GuessRow {
  healer: string;
  guessedAt: string;
  deviceId?: string;
}

export function calculateOdds(guesses: GuessRow[]): { total: number; odds: OddsEntry[] } {
  const latestGuessesPerUser = new Map<string, GuessRow>();
  
  // Sort chronologically by guessedAt to ensure the latest guess replaces earlier ones
  const sortedGuesses = [...guesses].sort(
    (a, b) => new Date(a.guessedAt).getTime() - new Date(b.guessedAt).getTime()
  );

  let fallbackIdCounter = 0;
  for (const guess of sortedGuesses) {
    const id = guess.deviceId || `fallback-id-${fallbackIdCounter++}`;
    latestGuessesPerUser.set(id, guess);
  }

  const counts = new Map<string, number>();
  for (const option of HEALER_OPTIONS) {
    counts.set(option, 0);
  }
  for (const guess of latestGuessesPerUser.values()) {
    counts.set(guess.healer, (counts.get(guess.healer) ?? 0) + 1);
  }

  const total = guesses.length; // Absolute total of all guesses ever cast
  const uniqueUserCount = latestGuessesPerUser.size;

  const odds: OddsEntry[] = HEALER_OPTIONS.map((healer) => {
    const count = counts.get(healer) ?? 0;
    return {
      healer: healer as Healer,
      count,
      percentage: uniqueUserCount === 0 ? 0 : (count / uniqueUserCount) * 100,
    };
  });
  return { total, odds };
}

export function buildGraphSeries(guesses: GuessRow[]): { points: GraphPoint[]; seriesNames: string[] } {
  if (guesses.length === 0) {
    return { points: [], seriesNames: [] };
  }

  const sorted = [...guesses].sort(
    (a, b) => new Date(a.guessedAt).getTime() - new Date(b.guessedAt).getTime()
  );

  const dayKeys: string[] = [];
  const seenDays = new Set<string>();
  for (const guess of sorted) {
    const key = getGuessingDayKey(new Date(guess.guessedAt));
    if (!seenDays.has(key)) {
      seenDays.add(key);
      dayKeys.push(key);
    }
  }

  const points: GraphPoint[] = [];
  const runningGuesses: GuessRow[] = [];
  let guessIndex = 0;

  for (const day of dayKeys) {
    while (
      guessIndex < sorted.length &&
      getGuessingDayKey(new Date(sorted[guessIndex].guessedAt)) === day
    ) {
      runningGuesses.push(sorted[guessIndex]);
      guessIndex += 1;
    }
    const { odds } = calculateOdds(runningGuesses);
    const point: GraphPoint = { date: day };
    for (const entry of odds) {
      point[entry.healer] = Number(entry.percentage.toFixed(2));
    }
    points.push(point);
  }

  return { points, seriesNames: [...HEALER_OPTIONS] };
}
