import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { calculateOdds, buildGraphSeries, type VoteRow } from '@/lib/oddsCalculator';

export const dynamic = 'force-dynamic';

// Number of rows fetched per page. Supabase/PostgREST silently caps unbounded
// selects at a default max-rows (commonly 1000), so we page through results
// to guarantee every vote row is counted regardless of table size.
export const VOTES_PAGE_SIZE = 1000;

type RawVoteRow = { healer: string; voted_at: string };

export async function fetchAllVotes(
  pageSize: number = VOTES_PAGE_SIZE
): Promise<{ data: RawVoteRow[] | null; error: { message: string } | null }> {
  const supabase = getSupabaseServerClient();
  const rows: RawVoteRow[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('votes')
      .select('healer, voted_at')
      .order('voted_at', { ascending: true })
      .range(from, to);

    if (error) {
      return { data: null, error };
    }

    const batch = (data ?? []) as RawVoteRow[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return { data: rows, error: null };
}

export async function GET() {
  const { data, error } = await fetchAllVotes();

  if (error) {
    return NextResponse.json({ error: 'Failed to load votes' }, { status: 500 });
  }

  const votes: VoteRow[] = (data ?? []).map((row: RawVoteRow) => ({
    healer: row.healer,
    votedAt: row.voted_at,
  }));
  const { total, odds } = calculateOdds(votes);
  const { points, seriesNames } = buildGraphSeries(votes);

  return NextResponse.json({ volume: total, odds, graph: { points, seriesNames } });
}
