import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseServerClient: vi.fn(),
}));

function createFakeSupabaseClient(options: {
  existingVotes?: Array<{ voted_at: string }>;
  fetchError?: { message: string } | null;
  insertError?: { message: string } | null;
}) {
  const { existingVotes = [], fetchError = null, insertError = null } = options;
  const insertMock = vi.fn().mockResolvedValue({ error: insertError });
  return {
    client: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn().mockResolvedValue({ data: existingVotes, error: fetchError }),
          })),
        })),
        insert: insertMock,
      })),
    },
    insertMock,
  };
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/vote', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
  });
}

describe('POST /api/vote', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('rejects invalid healer values', async () => {
    const { client } = createFakeSupabaseClient({});
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Fire Mage' })
    );

    expect(response.status).toBe(400);
  });

  it('records a first vote of the day', async () => {
    const { client, insertMock } = createFakeSupabaseClient({ existingVotes: [] });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(201);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ device_id: 'device-1', voter_name: 'Grug', healer: 'Holy Priest' })
    );
  });

  it('rejects a second vote in the same voting day', async () => {
    const { client } = createFakeSupabaseClient({
      existingVotes: [{ voted_at: '2026-06-01T10:00:00.000Z' }],
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(409);
  });

  it('rejects votes after the market close date', async () => {
    vi.setSystemTime(new Date('2026-08-13T00:00:00Z'));
    const { client } = createFakeSupabaseClient({});
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(403);
  });
});
