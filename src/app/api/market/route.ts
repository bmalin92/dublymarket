import { NextResponse } from 'next/server';
import { calculateOdds, buildGraphSeries, type VoteRow } from '@/lib/oddsCalculator';
import { fetchAllVotes, type RawVoteRow } from '@/lib/voteFetcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await fetchAllVotes();

  if (error) {
    return NextResponse.json({ error: 'Failed to load votes' }, { status: 500 });
  }

  const votes: VoteRow[] = (data ?? []).map((row: RawVoteRow) => ({
    healer: row.healer,
    votedAt: row.voted_at,
    deviceId: row.device_id,
  }));
  const { total, odds } = calculateOdds(votes);
  const { points, seriesNames } = buildGraphSeries(votes);

  return NextResponse.json({ volume: total, odds, graph: { points, seriesNames } });
}
