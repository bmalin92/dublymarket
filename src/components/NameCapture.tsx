'use client';

import { useState } from 'react';

interface NameCaptureProps {
  onSubmit: (name: string) => void;
}

export function NameCapture({ onSubmit }: NameCaptureProps) {
  const [name, setName] = useState('');

  return (
    <form
      className="flex gap-2 items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (trimmed) {
          onSubmit(trimmed);
        }
      }}
    >
      <label htmlFor="guesser-name" className="text-sm text-slate-600 dark:text-slate-300 font-medium">
        Your name, for the record:
      </label>
      <input
        id="guesser-name"
        className="rounded border border-slate-400 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Grug"
        required
      />
      <button
        type="submit"
        className="rounded bg-emerald-600 dark:bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors shadow-sm"
      >
        Continue
      </button>
    </form>
  );
}
