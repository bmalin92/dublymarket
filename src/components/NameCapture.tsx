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
      <label htmlFor="voter-name" className="text-sm text-slate-300">
        Your name, for the record:
      </label>
      <input
        id="voter-name"
        className="rounded bg-slate-800 px-3 py-1 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Grug"
        required
      />
      <button
        type="submit"
        className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Continue
      </button>
    </form>
  );
}
