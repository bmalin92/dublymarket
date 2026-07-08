import { NextResponse } from 'next/server';
import { calculateOdds, buildGraphSeries, type GuessRow } from '@/lib/oddsCalculator';
import { fetchAllGuesses, type RawGuessRow } from '@/lib/guessFetcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await fetchAllGuesses();

  if (error) {
    return NextResponse.json({ error: 'Failed to load guesses' }, { status: 500 });
  }

  const guesses: GuessRow[] = (data ?? []).map((row: RawGuessRow) => ({
    healer: row.healer,
    guessedAt: row.voted_at,
    deviceId: row.device_id,
  }));
  const { total, odds } = calculateOdds(guesses);
  const { points, seriesNames } = buildGraphSeries(guesses);

  return NextResponse.json({ volume: total, odds, graph: { points, seriesNames } });
}
