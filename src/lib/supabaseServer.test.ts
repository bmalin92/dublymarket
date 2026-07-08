import { describe, it, expect, afterEach, vi } from 'vitest';

describe('getSupabaseServerClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('throws when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const { getSupabaseServerClient } = await import('./supabaseServer');
    expect(() => getSupabaseServerClient()).toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    );
  });

  it('returns a client when env vars are set', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
    const { getSupabaseServerClient } = await import('./supabaseServer');
    const client = getSupabaseServerClient();
    expect(typeof client.from).toBe('function');
  });
});
