import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseServerClient: vi.fn(),
}));

function createFakeSupabaseClient(options: {
  existingVotes?: Array<{ id: string; voted_at: string; healer?: string }>;
  fetchError?: { message: string } | null;
  insertError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const { existingVotes = [], fetchError = null, insertError = null, updateError = null } = options;
  const insertMock = vi.fn().mockResolvedValue({ error: insertError });
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: updateError }),
  });
  return {
    client: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn().mockResolvedValue({ data: existingVotes, error: fetchError }),
          })),
        })),
        insert: insertMock,
        update: updateMock,
      })),
    },
    insertMock,
    updateMock,
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
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ device_id: 'device-1', voter_name: 'Grug', healer: 'Holy Priest' })
    );
    expect(typeof json.nextResetAt).toBe('string');
  });

  it('updates an existing vote in the same voting day', async () => {
    const { client, updateMock } = createFakeSupabaseClient({
      existingVotes: [{ id: 'vote-123', voted_at: '2026-06-01T10:00:00.000Z', healer: 'Holy Priest' }],
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Restoration Druid' })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ healer: 'Restoration Druid', voter_name: 'Grug' })
    );
    expect(json.ok).toBe(true);
    expect(typeof json.nextResetAt).toBe('string');
  });

  it('accepts a vote when the only existing vote is from a prior voting day', async () => {
    const { client, insertMock } = createFakeSupabaseClient({
      // Within the 48h lookback window, but falls in the prior ET voting day
      // relative to the mocked "now" of 2026-06-01T12:00:00Z (before
      // 2026-06-01T09:00:00Z UTC / 05:00 ET reset).
      existingVotes: [{ voted_at: '2026-05-31T09:00:00.000Z' }],
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(201);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ device_id: 'device-1', voter_name: 'Grug', healer: 'Holy Priest' })
    );
  });

  it('returns 500 when checking existing votes fails', async () => {
    const { client } = createFakeSupabaseClient({ fetchError: { message: 'boom' } });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(500);
  });

  it('returns 500 when inserting the vote fails', async () => {
    const { client } = createFakeSupabaseClient({
      existingVotes: [],
      insertError: { message: 'boom' },
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(500);
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
