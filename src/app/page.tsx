'use client';

import { useEffect, useState, useRef } from 'react';
import { NameCapture } from '@/components/NameCapture';
import { VoteOptions } from '@/components/VoteOptions';
import { OddsGraph } from '@/components/OddsGraph';
import { MarketStats } from '@/components/MarketStats';
import { getOrCreateDeviceId, getStoredName, storeName, clearIdentity } from '@/lib/deviceCookie';
import { MARKET_END_LABEL } from '@/lib/config';
import { isMarketClosed } from '@/lib/votingWindow';
import type { MarketResponse } from '@/lib/types';

function formatResetTime(isoString: string): string {
  const date = new Date(isoString);
  const formatted = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  });
  return formatted.replace(/\s+/g, '');
}

export default function Home() {
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [hasVotedToday, setHasVotedToday] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [nextResetAt, setNextResetAt] = useState<string | null>(null);
  const [marketClosed, setMarketClosed] = useState(false);

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  type Theme = 'light' | 'dark' | 'system';
  const [theme, setTheme] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
    setName(getStoredName());
    setMarketClosed(isMarketClosed(new Date()));
    fetchMarket();

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedReset = localStorage.getItem('nextResetAt');
    if (savedReset) {
      if (new Date(savedReset) > new Date()) {
        setNextResetAt(savedReset);
        setHasVotedToday(true);
      } else {
        localStorage.removeItem('nextResetAt');
      }
    }

    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isSystemDark = mediaQuery.matches;
      const shouldBeDark = theme === 'dark' || (theme === 'system' && isSystemDark);
      
      if (shouldBeDark) {
        root.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

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
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      setVoteError('You already voted today.');
      errorTimeoutRef.current = setTimeout(() => {
        setVoteError(null);
        errorTimeoutRef.current = null;
      }, 30000);

      setNextResetAt(data.nextResetAt);
      localStorage.setItem('nextResetAt', data.nextResetAt);
      setHasVotedToday(true);
      return;
    }
    if (response.status === 403) {
      setMarketClosed(true);
      return;
    }
    if (!response.ok) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      setVoteError('Something went wrong submitting your vote.');
      errorTimeoutRef.current = setTimeout(() => {
        setVoteError(null);
        errorTimeoutRef.current = null;
      }, 30000);
      return;
    }

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setVoteError(null);

    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setHasVotedToday(true);
    setShowSuccessMessage(true);
    successTimeoutRef.current = setTimeout(() => {
      setShowSuccessMessage(false);
      successTimeoutRef.current = null;
    }, 30000);

    setNextResetAt(data.nextResetAt);
    localStorage.setItem('nextResetAt', data.nextResetAt);
    fetchMarket();
  }

  function handleNameSubmit(submittedName: string) {
    storeName(submittedName);
    setName(submittedName);
  }

  function handleNotYou() {
    clearIdentity();
    localStorage.removeItem('nextResetAt');
    setDeviceId(getOrCreateDeviceId());
    setName(null);
    setVoteError(null);
    setHasVotedToday(false);
    setShowSuccessMessage(false);
    setNextResetAt(null);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">What healer will Dub play next season?</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vote once per day. Change your mind if you want.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider mr-1">Theme</span>
          <div className="inline-flex rounded-full bg-slate-200/50 dark:bg-slate-900/60 p-0.5 border border-slate-200 dark:border-slate-800">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleThemeChange(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all ${
                  theme === t
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {name && !hasVotedToday ? (
        <div className="text-sm text-slate-650 dark:text-slate-400">
          Voting as <span className="text-slate-900 dark:text-white font-semibold">{name}</span> ·{' '}
          <button type="button" className="underline hover:text-slate-900 dark:hover:text-white transition-colors" onClick={handleNotYou}>
            not you?
          </button>
        </div>
      ) : !name ? (
        <NameCapture onSubmit={handleNameSubmit} />
      ) : null}

      {marketClosed && (
        <div className="rounded border px-3 py-2 text-sm bg-rose-50 text-rose-900 border-rose-250 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/50">
          This market is closed.
        </div>
      )}

      {market && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <VoteOptions
              odds={market.odds}
              disabled={!name || marketClosed}
              disabledReason={
                marketClosed ? 'This market is closed.' : !name ? 'Enter your name to vote.' : null
              }
              onVote={handleVote}
              isDark={resolvedTheme === 'dark'}
            />
            <div className="md:col-span-2 rounded-xl border border-slate-400 dark:border-slate-600 bg-white/40 dark:bg-slate-900/20 p-4">
              <OddsGraph
                points={market.graph.points}
                seriesNames={market.graph.seriesNames}
                isDark={resolvedTheme === 'dark'}
              />
            </div>
          </div>

          <MarketStats volume={market.volume} endDate={MARKET_END_LABEL} />
        </>
      )}

      {voteError && (
        <div className="rounded border px-3 py-2 text-sm bg-amber-50 text-amber-900 border-amber-250 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50">
          {voteError}
          {nextResetAt && <> Resets at {formatResetTime(nextResetAt)}.</>}
        </div>
      )}

      {showSuccessMessage && !voteError && (
        <div className="rounded border px-3 py-2 text-sm bg-emerald-50 text-emerald-900 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50">
          Vote recorded!
          {nextResetAt && <> Resets at {formatResetTime(nextResetAt)}. </>}
          Update today's vote freely until then.
        </div>
      )}
    </main>
  );
}
