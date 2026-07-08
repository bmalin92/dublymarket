'use client';

import { useEffect, useState } from 'react';
import { NameCapture } from '@/components/NameCapture';
import { VoteOptions } from '@/components/VoteOptions';
import { OddsGraph } from '@/components/OddsGraph';
import { MarketStats } from '@/components/MarketStats';
import { getOrCreateDeviceId, getStoredName, storeName, clearIdentity } from '@/lib/deviceCookie';
import { MARKET_END_LABEL } from '@/lib/config';
import { isMarketClosed } from '@/lib/votingWindow';
import type { MarketResponse } from '@/lib/types';

export default function Home() {
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [nextResetAt, setNextResetAt] = useState<string | null>(null);
  const [marketClosed, setMarketClosed] = useState(false);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
    setName(getStoredName());
    setMarketClosed(isMarketClosed(new Date()));
    fetchMarket();
  }, []);

  async function fetchMarket() {
    const response = await fetch('/api/market');
    const data: MarketResponse = await response.json();
    setMarket(data);
  }

  async function handleVote(healer: string) {
    if (!deviceId || !name) {
      return;
    }

    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deviceId, name, healer }),
    });
    const data = await response.json();

    if (response.status === 409) {
      setVoteError('You already voted today.');
      setNextResetAt(data.nextResetAt);
      return;
    }
    if (response.status === 403) {
      setMarketClosed(true);
      return;
    }
    if (!response.ok) {
      setVoteError('Something went wrong submitting your vote.');
      return;
    }

    setVoteError(null);
    setNextResetAt(data.nextResetAt);
    fetchMarket();
  }

  function handleNameSubmit(submittedName: string) {
    storeName(submittedName);
    setName(submittedName);
  }

  function handleNotYou() {
    clearIdentity();
    setDeviceId(getOrCreateDeviceId());
    setName(null);
    setVoteError(null);
    setNextResetAt(null);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-white">What healer will Dub play next season?</h1>
        <p className="text-sm text-slate-400">Vote once per day. Change your mind if you want.</p>
      </header>

      {name ? (
        <div className="text-sm text-slate-400">
          Voting as <span className="text-white">{name}</span> ·{' '}
          <button type="button" className="underline" onClick={handleNotYou}>
            not you?
          </button>
        </div>
      ) : (
        <NameCapture onSubmit={handleNameSubmit} />
      )}

      {voteError && (
        <div className="rounded bg-amber-900/40 px-3 py-2 text-sm text-amber-200">
          {voteError}
          {nextResetAt && <> Resets at {new Date(nextResetAt).toLocaleString()}.</>}
        </div>
      )}

      {marketClosed && (
        <div className="rounded bg-rose-900/40 px-3 py-2 text-sm text-rose-200">
          This market is closed.
        </div>
      )}

      {market && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <VoteOptions
              odds={market.odds}
              disabled={!name || marketClosed}
              disabledReason={
                marketClosed ? 'This market is closed.' : !name ? 'Enter your name to vote.' : null
              }
              onVote={handleVote}
            />
            <OddsGraph points={market.graph.points} seriesNames={market.graph.seriesNames} />
          </div>

          <MarketStats volume={market.volume} endDate={MARKET_END_LABEL} />
        </>
      )}
    </main>
  );
}
