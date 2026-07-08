import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseServerClient: vi.fn(),
}));

function createFakeSupabaseClient(options: {
  existingGuesses?: Array<{ id: string; voted_at: string; healer?: string }>;
  fetchError?: { message: string } | null;
  insertError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const { existingGuesses = [], fetchError = null, insertError = null, updateError = null } = options;
  const insertMock = vi.fn().mockResolvedValue({ error: insertError });
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: updateError }),
  });
  return {
    client: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn().mockResolvedValue({ data: existingGuesses, error: fetchError }),
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
  return new Request('http://localhost/api/guess', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
  });
}

describe('POST /api/guess', () => {
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

  it('records a first guess of the day', async () => {
    const { client, insertMock } = createFakeSupabaseClient({ existingGuesses: [] });
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

  it('updates an existing guess in the same guessing day', async () => {
    const { client, updateMock } = createFakeSupabaseClient({
      existingGuesses: [{ id: 'vote-123', voted_at: '2026-06-01T10:00:00.000Z', healer: 'Holy Priest' }],
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Restoration Druid' })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ healer: 'Restoration Druid', voter_name: 'Grug', device_id: 'device-1' })
    );
    expect(json.ok).toBe(true);
    expect(typeof json.nextResetAt).toBe('string');
  });

  it('updates an existing guess if the name matches but deviceId is different', async () => {
    const { client, updateMock } = createFakeSupabaseClient({
      existingGuesses: [{ id: 'vote-123', voted_at: '2026-06-01T10:00:00.000Z', healer: 'Holy Priest' }],
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'different-device', name: 'Grug', healer: 'Restoration Druid' })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ healer: 'Restoration Druid', voter_name: 'Grug', device_id: 'different-device' })
    );
    expect(json.ok).toBe(true);
  });

  it('accepts a guess when the only existing guess is from a prior guessing day', async () => {
    const { client, insertMock } = createFakeSupabaseClient({
      // Within the 48h lookback window, but falls in the prior ET guessing day
      // relative to the mocked "now" of 2026-06-01T12:00:00Z (before
      // 2026-06-01T07:00:00Z UTC / 03:00 ET reset).
      existingGuesses: [{ voted_at: '2026-05-31T06:00:00.000Z' }],
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

  it('returns 500 when checking existing guesses fails', async () => {
    const { client } = createFakeSupabaseClient({ fetchError: { message: 'boom' } });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(500);
  });

  it('returns 500 when inserting the guess fails', async () => {
    const { client } = createFakeSupabaseClient({
      existingGuesses: [],
      insertError: { message: 'boom' },
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(500);
  });

  it('rejects guesses after the market close date', async () => {
    vi.setSystemTime(new Date('2026-08-13T00:00:00Z'));
    const { client } = createFakeSupabaseClient({});
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await POST(
      makeRequest({ deviceId: 'device-1', name: 'Grug', healer: 'Holy Priest' })
    );

    expect(response.status).toBe(403);
  });
});
