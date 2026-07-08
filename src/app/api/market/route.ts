import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { calculateOdds, buildGraphSeries, type VoteRow } from '@/lib/oddsCalculator';

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('votes').select('healer, voted_at');

  if (error) {
    return NextResponse.json({ error: 'Failed to load votes' }, { status: 500 });
  }

  const votes: VoteRow[] = (data ?? []).map((row: { healer: string; voted_at: string }) => ({
    healer: row.healer,
    votedAt: row.voted_at,
  }));
  const { total, odds } = calculateOdds(votes);
  const { points, seriesNames } = buildGraphSeries(votes);

  return NextResponse.json({ volume: total, odds, graph: { points, seriesNames } });
}
