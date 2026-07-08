import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './route';
import { fetchAllVotes } from '@/lib/voteFetcher';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseServerClient: vi.fn(),
}));

function mockClientForRange(rangeImpl: () => Promise<{ data: unknown; error: unknown }>) {
  const range = vi.fn(rangeImpl);
  const order = vi.fn(() => ({ range }));
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { from };
}

describe('GET /api/market', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns volume, odds, and graph data', async () => {
    const votes = [
      { healer: 'Holy Priest', voted_at: '2026-06-01T12:00:00.000Z', device_id: 'user-1' },
      { healer: 'Holy Priest', voted_at: '2026-06-02T12:00:00.000Z', device_id: 'user-2' },
      { healer: 'Restoration Druid', voted_at: '2026-06-02T12:00:00.000Z', device_id: 'user-3' },
    ];
    const client = mockClientForRange(async () => ({ data: votes, error: null }));
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.volume).toBe(3);
    const holyPriest = body.odds.find((entry: { healer: string }) => entry.healer === 'Holy Priest');
    expect(holyPriest.count).toBe(2);
    expect(holyPriest.percentage).toBeCloseTo(66.67, 1);
    expect(body.graph.points.length).toBe(2);
  });

  it('returns 500 when supabase errors', async () => {
    const client = mockClientForRange(async () => ({ data: null, error: { message: 'boom' } }));
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await GET();
    expect(response.status).toBe(500);
  });

  it('paginates through multiple pages and concatenates all rows', async () => {
    const allVotes = [
      { healer: 'Holy Priest', voted_at: '2026-06-01T12:00:00.000Z', device_id: 'user-1' },
      { healer: 'Restoration Druid', voted_at: '2026-06-02T12:00:00.000Z', device_id: 'user-2' },
      { healer: 'Mistweaver Monk', voted_at: '2026-06-03T12:00:00.000Z', device_id: 'user-3' },
    ];
    const pageSize = 2;
    let call = 0;
    const range = vi.fn(async () => {
      const batch = allVotes.slice(call * pageSize, call * pageSize + pageSize);
      call += 1;
      return { data: batch, error: null };
    });
    const order = vi.fn(() => ({ range }));
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    vi.mocked(getSupabaseServerClient).mockReturnValue({ from } as any);

    const { data, error } = await fetchAllVotes(pageSize);

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data).toEqual(allVotes);
    expect(range).toHaveBeenCalledTimes(2);
  });
});
