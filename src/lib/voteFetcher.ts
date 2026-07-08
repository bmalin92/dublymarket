import { getSupabaseServerClient } from '@/lib/supabaseServer';

// Number of rows fetched per page. Supabase/PostgREST silently caps unbounded
// selects at a default max-rows (commonly 1000), so we page through results
// to guarantee every vote row is counted regardless of table size.
export const VOTES_PAGE_SIZE = 1000;

export type RawVoteRow = { healer: string; voted_at: string };

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
