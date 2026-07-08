import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { getVotingDayKey, getNextResetTime, isMarketClosed } from '@/lib/votingWindow';
import { HEALER_OPTIONS, type Healer } from '@/lib/config';

interface VoteRequestBody {
  deviceId: string;
  name: string;
  healer: string;
}

function isValidHealer(value: string): value is Healer {
  return (HEALER_OPTIONS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<VoteRequestBody>;

  if (!body.deviceId || !body.name || !body.healer) {
    return NextResponse.json({ error: 'deviceId, name, and healer are required' }, { status: 400 });
  }
  if (!isValidHealer(body.healer)) {
    return NextResponse.json({ error: 'Invalid healer option' }, { status: 400 });
  }

  const now = new Date();

  if (isMarketClosed(now)) {
    return NextResponse.json({ error: 'Market is closed' }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  const todayKey = getVotingDayKey(now);
  const lookback = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const { data: recentVotes, error: fetchError } = await supabase
    .from('votes')
    .select('id, voted_at, healer')
    .eq('device_id', body.deviceId)
    .gte('voted_at', lookback.toISOString());

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to check existing votes' }, { status: 500 });
  }

  const todayVote = (recentVotes ?? []).find(
    (vote: { voted_at: string }) => getVotingDayKey(new Date(vote.voted_at)) === todayKey
  );

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  if (todayVote) {
    const { error: updateError } = await supabase
      .from('votes')
      .update({
        healer: body.healer,
        voter_name: body.name,
        ip_address: ipAddress,
        voted_at: now.toISOString(),
      })
      .eq('id', todayVote.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update vote' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, nextResetAt: getNextResetTime(now).toISOString() }, { status: 200 });
  }

  const { error: insertError } = await supabase.from('votes').insert({
    device_id: body.deviceId,
    ip_address: ipAddress,
    voter_name: body.name,
    healer: body.healer,
    voted_at: now.toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, nextResetAt: getNextResetTime(now).toISOString() }, { status: 201 });
}
