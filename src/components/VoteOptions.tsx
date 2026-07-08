'use client';

import type { OddsEntry } from '@/lib/types';

interface VoteOptionsProps {
  odds: OddsEntry[];
  disabled: boolean;
  disabledReason: string | null;
  onVote: (healer: string) => void;
}

export function VoteOptions({ odds, disabled, disabledReason, onVote }: VoteOptionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {disabled && disabledReason && (
        <div className="rounded bg-slate-800 px-3 py-2 text-sm text-slate-300">{disabledReason}</div>
      )}
      {odds.map((entry) => (
        <button
          key={entry.healer}
          type="button"
          disabled={disabled}
          onClick={() => onVote(entry.healer)}
          className="relative overflow-hidden rounded border border-slate-700 px-3 py-2 text-left text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 hover:border-emerald-500"
        >
          <span
            className="absolute inset-y-0 left-0 bg-emerald-900/40"
            style={{ width: `${entry.percentage}%` }}
          />
          <span className="relative flex justify-between">
            <span>{entry.healer}</span>
            <span>{entry.percentage.toFixed(1)}%</span>
          </span>
        </button>
      ))}
    </div>
  );
}
