import { getSupabaseServerClient } from '@/lib/supabaseServer';

// Number of rows fetched per page. Supabase/PostgREST silently caps unbounded
// selects at a default max-rows (commonly 1000), so we page through results
// to guarantee every guess row is counted regardless of table size.
export const GUESSES_PAGE_SIZE = 1000;

export type RawGuessRow = { healer: string; voted_at: string; device_id: string; voter_name: string };

export async function fetchAllGuesses(
  pageSize: number = GUESSES_PAGE_SIZE
): Promise<{ data: RawGuessRow[] | null; error: { message: string } | null }> {
  const supabase = getSupabaseServerClient();
  const rows: RawGuessRow[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('votes')
      .select('healer, voted_at, device_id, voter_name')
      .order('voted_at', { ascending: true })
      .range(from, to);

    if (error) {
      return { data: null, error };
    }

    const batch = (data ?? []) as RawGuessRow[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return { data: rows, error: null };
}
