import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './route';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseServerClient: vi.fn(),
}));

describe('GET /api/market', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns volume, odds, and graph data', async () => {
    const votes = [
      { healer: 'Holy Priest', voted_at: '2026-06-01T12:00:00.000Z' },
      { healer: 'Holy Priest', voted_at: '2026-06-02T12:00:00.000Z' },
      { healer: 'Restoration Druid', voted_at: '2026-06-02T12:00:00.000Z' },
    ];
    const client = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: votes, error: null }),
      })),
    };
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
    const client = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
      })),
    };
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await GET();
    expect(response.status).toBe(500);
  });
});
