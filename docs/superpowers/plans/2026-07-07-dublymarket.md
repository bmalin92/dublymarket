# Dublymarket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, responsive prediction-market joke app where World of Warcraft guildmates daily-vote (no accounts) on which healer Dub will play next season, with results persisted in Supabase and viewable Polymarket-style.

**Architecture:** Next.js (App Router, TypeScript) deployed on Vercel, backed by a single `votes` table in Supabase Postgres. All vote validation (once-per-day, market-closed) and odds/graph math run server-side in Next.js API routes; the browser only ever calls `/api/vote` and `/api/market`. Device identity is a cookie-stored UUID; voter name is a self-reported cookie. No auth, no admin UI — Dub reviews/export data via the Supabase dashboard directly.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript, Tailwind CSS, Recharts (graph), `@supabase/supabase-js`, Vitest + Testing Library for tests, Vercel (hosting) + Supabase (Postgres), both free tier.

## Global Constraints

- Healer options (exact 9, in this order): Holy Priest, Discipline Priest, Restoration Druid, Restoration Shaman, Holy Paladin, Mistweaver Monk, Preservation Evoker, Bard Hunter, DPS.
- Market close: Aug 12, 2026, 5:00 AM US Eastern (`America/New_York`).
- Daily vote reset: 5:00 AM US Eastern, every day.
- Odds/graph methodology: tally **every vote ever cast** per healer (not latest-per-device) as a percentage of total votes cast.
- Graph shows one series per day for the 5 healers with the highest current percentage, plus a 6th "Other" series summing the rest. Ranking is computed once per request, not re-sorted per historical day.
- Every vote is a new database row; the app never updates or deletes a `votes` row.
- No user accounts, no in-app admin UI. Free tier only — Vercel + Supabase, no paid services.
- Device identity persists via a long-lived cookie (`dublymarket_device_id`); voter name persists via a separate cookie (`dublymarket_name`). IP address is logged as a soft backstop only and never blocks a vote by itself.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.gitignore`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Test: `src/lib/sanity.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working Next.js + TypeScript + Tailwind skeleton. Later tasks rely on: `npm test` running Vitest, `npm run dev` running the dev server on port 3000, and the `@/*` path alias resolving to `src/*`.

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
.next/
.env.local
.DS_Store
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "dublymarket",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 5: Create `tailwind.config.ts` and `postcss.config.mjs`**

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

`postcss.config.mjs`:
```js
const config = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
export default config;
```

- [ ] **Step 6: Create `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`**

`src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0b0e14;
  color: #f5f5f5;
}
```

`src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dublymarket',
  description: 'What healer will Dub play next season?',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx` (placeholder, replaced in Task 8):
```tsx
export default function Home() {
  return <main className="p-8">Dublymarket coming soon.</main>;
}
```

- [ ] **Step 7: Create `vitest.config.ts` and `vitest.setup.ts`**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

`vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 8: Write a sanity test**

`src/lib/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 9: Install dependencies and run the test suite**

Run: `npm install && npm test`
Expected: install succeeds, `sanity.test.ts` passes (1 test passed).

- [ ] **Step 10: Verify the dev server boots**

Run: `npm run dev &` then `sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` then stop the dev server.
Expected: HTTP status `200`.

- [ ] **Step 11: Commit**

```bash
git add package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs .gitignore vitest.config.ts vitest.setup.ts src/app/layout.tsx src/app/globals.css src/app/page.tsx src/lib/sanity.test.ts
git commit -m "chore: scaffold Next.js app with Tailwind and Vitest"
```

---

### Task 2: Config and Voting Window Logic

**Files:**
- Create: `src/lib/config.ts`
- Create: `src/lib/votingWindow.ts`
- Test: `src/lib/votingWindow.test.ts`

**Interfaces:**
- Consumes: nothing beyond the scaffold from Task 1.
- Produces:
  - `src/lib/config.ts`: `HEALER_OPTIONS: readonly string[]`, `type Healer`, `MARKET_TIMEZONE: string`, `RESET_HOUR: number`, `MARKET_CLOSE_ET: { year, month, day }`, `MARKET_END_LABEL: string`.
  - `src/lib/votingWindow.ts`: `getVotingDayKey(date: Date): string`, `getNextResetTime(date: Date): Date`, `isMarketClosed(date: Date): boolean`.

- [ ] **Step 1: Create `src/lib/config.ts`**

```ts
export const HEALER_OPTIONS = [
  'Holy Priest',
  'Discipline Priest',
  'Restoration Druid',
  'Restoration Shaman',
  'Holy Paladin',
  'Mistweaver Monk',
  'Preservation Evoker',
  'Bard Hunter',
  'DPS',
] as const;

export type Healer = (typeof HEALER_OPTIONS)[number];

export const MARKET_TIMEZONE = 'America/New_York';
export const RESET_HOUR = 5;
export const MARKET_CLOSE_ET = { year: 2026, month: 8, day: 12 } as const;
export const MARKET_END_LABEL = 'Aug 12, 2026';
```

- [ ] **Step 2: Write failing tests for the voting window functions**

`src/lib/votingWindow.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getVotingDayKey, getNextResetTime, isMarketClosed } from './votingWindow';

describe('getVotingDayKey', () => {
  it('treats times before 5am ET as belonging to the previous voting day', () => {
    // 2026-01-15 04:59 ET = 2026-01-15 09:59 UTC (EST, UTC-5)
    expect(getVotingDayKey(new Date('2026-01-15T09:59:00Z'))).toBe('2026-01-14');
  });

  it('treats 5am ET and later as the current voting day', () => {
    // 2026-01-15 05:00 ET = 2026-01-15 10:00 UTC (EST, UTC-5)
    expect(getVotingDayKey(new Date('2026-01-15T10:00:00Z'))).toBe('2026-01-15');
  });

  it('is correct across the spring-forward DST transition', () => {
    // 2026-03-09 is the first day of EDT (UTC-4) in the US.
    expect(getVotingDayKey(new Date('2026-03-09T08:59:00Z'))).toBe('2026-03-08');
    expect(getVotingDayKey(new Date('2026-03-09T09:00:00Z'))).toBe('2026-03-09');
  });
});

describe('getNextResetTime', () => {
  it('returns today\'s reset when called before it', () => {
    const result = getNextResetTime(new Date('2026-01-15T09:59:00Z'));
    expect(result.toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });

  it('returns tomorrow\'s reset when called after today\'s', () => {
    const result = getNextResetTime(new Date('2026-01-15T10:00:01Z'));
    expect(result.toISOString()).toBe('2026-01-16T10:00:00.000Z');
  });
});

describe('isMarketClosed', () => {
  it('is false just before the close instant', () => {
    // 2026-08-12 05:00 ET = 2026-08-12 09:00 UTC (EDT, UTC-4)
    expect(isMarketClosed(new Date('2026-08-12T08:59:00Z'))).toBe(false);
  });

  it('is true at and after the close instant', () => {
    expect(isMarketClosed(new Date('2026-08-12T09:00:00Z'))).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests and verify they fail**

Run: `npx vitest run src/lib/votingWindow.test.ts`
Expected: FAIL — `votingWindow.ts` does not exist / exports not found.

- [ ] **Step 4: Implement `src/lib/votingWindow.ts`**

```ts
import { MARKET_CLOSE_ET, MARKET_TIMEZONE, RESET_HOUR } from './config';

interface EtParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getEtParts(date: Date): EtParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MARKET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: map.hour === '24' ? 0 : Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function etWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const etPartsOfGuess = getEtParts(utcGuess);
  const etAsUtc = Date.UTC(
    etPartsOfGuess.year,
    etPartsOfGuess.month - 1,
    etPartsOfGuess.day,
    etPartsOfGuess.hour,
    etPartsOfGuess.minute,
    etPartsOfGuess.second
  );
  const offsetMs = utcGuess.getTime() - etAsUtc;
  return new Date(utcGuess.getTime() + offsetMs);
}

export function getVotingDayKey(date: Date): string {
  const parts = getEtParts(date);
  const dayStart = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (parts.hour < RESET_HOUR) {
    dayStart.setUTCDate(dayStart.getUTCDate() - 1);
  }
  return dayStart.toISOString().slice(0, 10);
}

export function getNextResetTime(date: Date): Date {
  const parts = getEtParts(date);
  const todayReset = etWallTimeToUtc(parts.year, parts.month, parts.day, RESET_HOUR, 0);
  if (date.getTime() < todayReset.getTime()) {
    return todayReset;
  }
  const nextDayCalendar = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return etWallTimeToUtc(
    nextDayCalendar.getUTCFullYear(),
    nextDayCalendar.getUTCMonth() + 1,
    nextDayCalendar.getUTCDate(),
    RESET_HOUR,
    0
  );
}

const MARKET_CLOSE_UTC = etWallTimeToUtc(
  MARKET_CLOSE_ET.year,
  MARKET_CLOSE_ET.month,
  MARKET_CLOSE_ET.day,
  RESET_HOUR,
  0
);

export function isMarketClosed(date: Date): boolean {
  return date.getTime() >= MARKET_CLOSE_UTC.getTime();
}
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npx vitest run src/lib/votingWindow.test.ts`
Expected: PASS — 7 tests passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/config.ts src/lib/votingWindow.ts src/lib/votingWindow.test.ts
git commit -m "feat: add market config and 5am ET voting window logic"
```

---

### Task 3: Odds and Graph Calculator

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/oddsCalculator.ts`
- Test: `src/lib/oddsCalculator.test.ts`

**Interfaces:**
- Consumes: `HEALER_OPTIONS`, `Healer` from `src/lib/config.ts` (Task 2); `getVotingDayKey` from `src/lib/votingWindow.ts` (Task 2).
- Produces:
  - `src/lib/types.ts`: `OddsEntry { healer: Healer; count: number; percentage: number }`, `GraphPoint { date: string; [seriesName: string]: number | string }`, `MarketResponse { volume: number; odds: OddsEntry[]; graph: { points: GraphPoint[]; seriesNames: string[] } }`.
  - `src/lib/oddsCalculator.ts`: `VoteRow { healer: string; votedAt: string }`, `calculateOdds(votes: VoteRow[]): { total: number; odds: OddsEntry[] }`, `buildGraphSeries(votes: VoteRow[]): { points: GraphPoint[]; seriesNames: string[] }`.

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
import type { Healer } from './config';

export interface OddsEntry {
  healer: Healer;
  count: number;
  percentage: number;
}

export interface GraphPoint {
  date: string;
  [seriesName: string]: number | string;
}

export interface MarketResponse {
  volume: number;
  odds: OddsEntry[];
  graph: {
    points: GraphPoint[];
    seriesNames: string[];
  };
}
```

- [ ] **Step 2: Write failing tests for the odds calculator**

`src/lib/oddsCalculator.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { calculateOdds, buildGraphSeries, type VoteRow } from './oddsCalculator';
import { HEALER_OPTIONS } from './config';

describe('calculateOdds', () => {
  it('returns zero percentages for an empty vote list, one entry per option', () => {
    const { total, odds } = calculateOdds([]);
    expect(total).toBe(0);
    expect(odds).toHaveLength(HEALER_OPTIONS.length);
    expect(odds.every((entry) => entry.percentage === 0)).toBe(true);
  });

  it('tallies every vote cast, not just the latest per voter', () => {
    const votes: VoteRow[] = [
      { healer: 'Holy Priest', votedAt: '2026-06-01T12:00:00.000Z' },
      { healer: 'Holy Priest', votedAt: '2026-06-02T12:00:00.000Z' },
      { healer: 'Restoration Druid', votedAt: '2026-06-02T12:00:00.000Z' },
    ];
    const { total, odds } = calculateOdds(votes);
    expect(total).toBe(3);
    const holyPriest = odds.find((entry) => entry.healer === 'Holy Priest')!;
    expect(holyPriest.count).toBe(2);
    expect(holyPriest.percentage).toBeCloseTo((2 / 3) * 100, 5);
  });
});

describe('buildGraphSeries', () => {
  it('returns no points for an empty vote list', () => {
    const { points, seriesNames } = buildGraphSeries([]);
    expect(points).toEqual([]);
    expect(seriesNames).toEqual([]);
  });

  it('builds one point per voting day and caps series at top 5 plus Other', () => {
    const votes: VoteRow[] = [
      { healer: 'Holy Priest', votedAt: '2026-06-01T12:00:00.000Z' },
      { healer: 'Discipline Priest', votedAt: '2026-06-01T12:05:00.000Z' },
      { healer: 'Restoration Druid', votedAt: '2026-06-01T12:10:00.000Z' },
      { healer: 'Restoration Shaman', votedAt: '2026-06-01T12:15:00.000Z' },
      { healer: 'Holy Paladin', votedAt: '2026-06-01T12:20:00.000Z' },
      { healer: 'Mistweaver Monk', votedAt: '2026-06-01T12:25:00.000Z' },
      { healer: 'Bard Hunter', votedAt: '2026-06-02T12:00:00.000Z' },
    ];

    const { points, seriesNames } = buildGraphSeries(votes);

    expect(points).toHaveLength(2);
    expect(points[0].date).toBe('2026-06-01');
    expect(points[1].date).toBe('2026-06-02');
    expect(seriesNames).toHaveLength(6);
    expect(seriesNames).toContain('Other');

    const day2 = points[1];
    const seriesTotal = seriesNames.reduce((sum, name) => sum + Number(day2[name]), 0);
    expect(seriesTotal).toBeCloseTo(100, 1);
  });
});
```

- [ ] **Step 3: Run tests and verify they fail**

Run: `npx vitest run src/lib/oddsCalculator.test.ts`
Expected: FAIL — `oddsCalculator.ts` does not exist.

- [ ] **Step 4: Implement `src/lib/oddsCalculator.ts`**

```ts
import { HEALER_OPTIONS, type Healer } from './config';
import { getVotingDayKey } from './votingWindow';
import type { OddsEntry, GraphPoint } from './types';

export interface VoteRow {
  healer: string;
  votedAt: string;
}

export function calculateOdds(votes: VoteRow[]): { total: number; odds: OddsEntry[] } {
  const counts = new Map<string, number>();
  for (const option of HEALER_OPTIONS) {
    counts.set(option, 0);
  }
  for (const vote of votes) {
    counts.set(vote.healer, (counts.get(vote.healer) ?? 0) + 1);
  }
  const total = votes.length;
  const odds: OddsEntry[] = HEALER_OPTIONS.map((healer) => {
    const count = counts.get(healer) ?? 0;
    return {
      healer: healer as Healer,
      count,
      percentage: total === 0 ? 0 : (count / total) * 100,
    };
  });
  return { total, odds };
}

export function buildGraphSeries(votes: VoteRow[]): { points: GraphPoint[]; seriesNames: string[] } {
  if (votes.length === 0) {
    return { points: [], seriesNames: [] };
  }

  const sorted = [...votes].sort(
    (a, b) => new Date(a.votedAt).getTime() - new Date(b.votedAt).getTime()
  );

  const dayKeys: string[] = [];
  const seenDays = new Set<string>();
  for (const vote of sorted) {
    const key = getVotingDayKey(new Date(vote.votedAt));
    if (!seenDays.has(key)) {
      seenDays.add(key);
      dayKeys.push(key);
    }
  }

  const { odds: finalOdds } = calculateOdds(votes);
  const topFive = [...finalOdds]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
    .map((entry) => entry.healer as string);
  const topFiveSet = new Set(topFive);

  const points: GraphPoint[] = [];
  const runningVotes: VoteRow[] = [];
  let voteIndex = 0;

  for (const day of dayKeys) {
    while (
      voteIndex < sorted.length &&
      getVotingDayKey(new Date(sorted[voteIndex].votedAt)) === day
    ) {
      runningVotes.push(sorted[voteIndex]);
      voteIndex += 1;
    }
    const { odds } = calculateOdds(runningVotes);
    const point: GraphPoint = { date: day };
    let otherTotal = 0;
    for (const entry of odds) {
      if (topFiveSet.has(entry.healer)) {
        point[entry.healer] = Number(entry.percentage.toFixed(2));
      } else {
        otherTotal += entry.percentage;
      }
    }
    point.Other = Number(otherTotal.toFixed(2));
    points.push(point);
  }

  return { points, seriesNames: [...topFive, 'Other'] };
}
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npx vitest run src/lib/oddsCalculator.test.ts`
Expected: PASS — 4 tests passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/oddsCalculator.ts src/lib/oddsCalculator.test.ts
git commit -m "feat: add odds tally and top-5-plus-Other graph series calculator"
```

---

### Task 4: Supabase Schema and Server Client

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/supabaseServer.ts`
- Create: `.env.local.example`
- Test: `src/lib/supabaseServer.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `src/lib/supabaseServer.ts`: `getSupabaseServerClient(): SupabaseClient` — throws if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` env vars are unset.

- [ ] **Step 1: Create `supabase/schema.sql`**

```sql
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  ip_address text,
  voter_name text not null,
  healer text not null,
  voted_at timestamptz not null default now()
);

create index if not exists votes_device_id_voted_at_idx on votes (device_id, voted_at);
```

- [ ] **Step 2: Create `.env.local.example`**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 3: Write failing tests for the Supabase client factory**

`src/lib/supabaseServer.test.ts`:
```ts
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
```

- [ ] **Step 4: Run tests and verify they fail**

Run: `npx vitest run src/lib/supabaseServer.test.ts`
Expected: FAIL — `supabaseServer.ts` does not exist.

- [ ] **Step 5: Implement `src/lib/supabaseServer.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
```

- [ ] **Step 6: Run tests and verify they pass**

Run: `npx vitest run src/lib/supabaseServer.test.ts`
Expected: PASS — 2 tests passed.

- [ ] **Step 7: Commit**

```bash
git add supabase/schema.sql .env.local.example src/lib/supabaseServer.ts src/lib/supabaseServer.test.ts
git commit -m "feat: add votes table schema and Supabase server client factory"
```

---

### Task 5: POST /api/vote Route

**Files:**
- Create: `src/app/api/vote/route.ts`
- Test: `src/app/api/vote/route.test.ts`

**Interfaces:**
- Consumes: `getSupabaseServerClient` (Task 4); `getVotingDayKey`, `getNextResetTime`, `isMarketClosed` (Task 2); `HEALER_OPTIONS`, `Healer` (Task 2).
- Produces: `POST` handler at `/api/vote` accepting `{ deviceId: string; name: string; healer: string }`, returning `201` on success (body includes `nextResetAt: string`), `400` for invalid input, `403` if market closed, `409` if already voted today (body includes `nextResetAt: string`), `500` on database error.

- [ ] **Step 1: Write failing tests for the vote route**

`src/app/api/vote/route.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npx vitest run src/app/api/vote/route.test.ts`
Expected: FAIL — `route.ts` does not exist.

- [ ] **Step 3: Implement `src/app/api/vote/route.ts`**

```ts
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
    .select('voted_at')
    .eq('device_id', body.deviceId)
    .gte('voted_at', lookback.toISOString());

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to check existing votes' }, { status: 500 });
  }

  const alreadyVotedToday = (recentVotes ?? []).some(
    (vote: { voted_at: string }) => getVotingDayKey(new Date(vote.voted_at)) === todayKey
  );

  if (alreadyVotedToday) {
    return NextResponse.json(
      {
        error: 'Already voted today',
        nextResetAt: getNextResetTime(now).toISOString(),
      },
      { status: 409 }
    );
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

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
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npx vitest run src/app/api/vote/route.test.ts`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/vote/route.ts src/app/api/vote/route.test.ts
git commit -m "feat: add POST /api/vote with once-per-day and market-close enforcement"
```

---

### Task 6: GET /api/market Route

**Files:**
- Create: `src/app/api/market/route.ts`
- Test: `src/app/api/market/route.test.ts`

**Interfaces:**
- Consumes: `getSupabaseServerClient` (Task 4); `calculateOdds`, `buildGraphSeries`, `VoteRow` (Task 3).
- Produces: `GET` handler at `/api/market` returning `200` with body `MarketResponse` (Task 3's type) on success, `500` on database error.

- [ ] **Step 1: Write failing tests for the market route**

`src/app/api/market/route.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './route';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseServerClient: vi.fn(),
}));

describe('GET /api/market', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns volume, odds, and graph data', async () => {
    const votes = [
      { healer: 'Holy Priest', voted_at: '2026-06-01T12:00:00.000Z' },
      { healer: 'Holy Priest', voted_at: '2026-06-02T12:00:00.000Z' },
      { healer: 'Restoration Druid', voted_at: '2026-06-02T12:00:00.000Z' },
    ];
    const client = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: votes, error: null }),
      })),
    };
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.volume).toBe(3);
    const holyPriest = body.odds.find((entry: { healer: string }) => entry.healer === 'Holy Priest');
    expect(holyPriest.count).toBe(2);
    expect(holyPriest.percentage).toBeCloseTo(66.67, 1);
    expect(body.graph.points.length).toBe(2);
  });

  it('returns 500 when supabase errors', async () => {
    const client = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
      })),
    };
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as any);

    const response = await GET();
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npx vitest run src/app/api/market/route.test.ts`
Expected: FAIL — `route.ts` does not exist.

- [ ] **Step 3: Implement `src/app/api/market/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { calculateOdds, buildGraphSeries, type VoteRow } from '@/lib/oddsCalculator';

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('votes').select('healer, voted_at');

  if (error) {
    return NextResponse.json({ error: 'Failed to load votes' }, { status: 500 });
  }

  const votes: VoteRow[] = (data ?? []).map((row: { healer: string; voted_at: string }) => ({
    healer: row.healer,
    votedAt: row.voted_at,
  }));
  const { total, odds } = calculateOdds(votes);
  const { points, seriesNames } = buildGraphSeries(votes);

  return NextResponse.json({ volume: total, odds, graph: { points, seriesNames } });
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npx vitest run src/app/api/market/route.test.ts`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/market/route.ts src/app/api/market/route.test.ts
git commit -m "feat: add GET /api/market returning volume, odds, and graph series"
```

---

### Task 7: Device and Name Cookie Helpers

**Files:**
- Create: `src/lib/deviceCookie.ts`
- Test: `src/lib/deviceCookie.test.ts`

**Interfaces:**
- Consumes: nothing new (browser-only, no server dependency).
- Produces: `getOrCreateDeviceId(): string`, `getStoredName(): string | null`, `storeName(name: string): void`, `clearIdentity(): void`.

- [ ] **Step 1: Write failing tests for the cookie helpers**

`src/lib/deviceCookie.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getOrCreateDeviceId, getStoredName, storeName, clearIdentity } from './deviceCookie';

function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=; max-age=0; path=/`;
    }
  });
}

describe('deviceCookie', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  it('creates and persists a device id', () => {
    const id = getOrCreateDeviceId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(getOrCreateDeviceId()).toBe(id);
  });

  it('stores and retrieves a name', () => {
    expect(getStoredName()).toBeNull();
    storeName('Grug');
    expect(getStoredName()).toBe('Grug');
  });

  it('clears both cookies', () => {
    getOrCreateDeviceId();
    storeName('Grug');
    clearIdentity();
    expect(getStoredName()).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npx vitest run src/lib/deviceCookie.test.ts`
Expected: FAIL — `deviceCookie.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/deviceCookie.ts`**

```ts
const DEVICE_ID_COOKIE = 'dublymarket_device_id';
const NAME_COOKIE = 'dublymarket_name';
const FIVE_YEARS_SECONDS = 60 * 60 * 24 * 365 * 5;

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${FIVE_YEARS_SECONDS}; path=/; samesite=lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; max-age=0; path=/`;
}

export function getOrCreateDeviceId(): string {
  const existing = readCookie(DEVICE_ID_COOKIE);
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  writeCookie(DEVICE_ID_COOKIE, id);
  return id;
}

export function getStoredName(): string | null {
  return readCookie(NAME_COOKIE);
}

export function storeName(name: string) {
  writeCookie(NAME_COOKIE, name);
}

export function clearIdentity() {
  deleteCookie(DEVICE_ID_COOKIE);
  deleteCookie(NAME_COOKIE);
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npx vitest run src/lib/deviceCookie.test.ts`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/deviceCookie.ts src/lib/deviceCookie.test.ts
git commit -m "feat: add browser device-id and voter-name cookie helpers"
```

---

### Task 8: UI Components and Page Wiring

**Files:**
- Create: `src/components/NameCapture.tsx`
- Create: `src/components/VoteOptions.tsx`
- Create: `src/components/OddsGraph.tsx`
- Create: `src/components/MarketStats.tsx`
- Modify: `src/app/page.tsx` (replace placeholder from Task 1)
- Test: `src/components/NameCapture.test.tsx`
- Test: `src/components/VoteOptions.test.tsx`

**Interfaces:**
- Consumes: `OddsEntry`, `GraphPoint`, `MarketResponse` (Task 3); `getOrCreateDeviceId`, `getStoredName`, `storeName`, `clearIdentity` (Task 7); `/api/vote` and `/api/market` (Tasks 5, 6); `MARKET_END_LABEL` (Task 2).
- Produces: the full page UI at `/`. No further tasks consume this directly.

- [ ] **Step 1: Write failing tests for `NameCapture` and `VoteOptions`**

`src/components/NameCapture.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NameCapture } from './NameCapture';

describe('NameCapture', () => {
  it('submits the trimmed name', async () => {
    const onSubmit = vi.fn();
    render(<NameCapture onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/your name/i), '  Grug  ');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith('Grug');
  });
});
```

`src/components/VoteOptions.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoteOptions } from './VoteOptions';

describe('VoteOptions', () => {
  it('calls onVote with the clicked healer', async () => {
    const onVote = vi.fn();
    render(
      <VoteOptions
        odds={[
          { healer: 'Holy Priest', count: 1, percentage: 50 },
          { healer: 'Restoration Druid', count: 1, percentage: 50 },
        ]}
        disabled={false}
        disabledReason={null}
        onVote={onVote}
      />
    );

    await userEvent.click(screen.getByText('Holy Priest'));

    expect(onVote).toHaveBeenCalledWith('Holy Priest');
  });

  it('disables buttons and shows the reason when disabled', () => {
    render(
      <VoteOptions
        odds={[{ healer: 'Holy Priest', count: 0, percentage: 0 }]}
        disabled={true}
        disabledReason="Enter your name to vote."
        onVote={vi.fn()}
      />
    );

    expect(screen.getByText('Enter your name to vote.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Holy Priest/ })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npx vitest run src/components/NameCapture.test.tsx src/components/VoteOptions.test.tsx`
Expected: FAIL — components do not exist.

- [ ] **Step 3: Implement `src/components/NameCapture.tsx`**

```tsx
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
```

- [ ] **Step 4: Implement `src/components/VoteOptions.tsx`**

```tsx
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
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npx vitest run src/components/NameCapture.test.tsx src/components/VoteOptions.test.tsx`
Expected: PASS — 3 tests passed.

- [ ] **Step 6: Implement `src/components/OddsGraph.tsx` (no dedicated unit test — visual, covered by the manual smoke test in Task 9)**

```tsx
'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GraphPoint } from '@/lib/types';

const SERIES_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#94a3b8'];

interface OddsGraphProps {
  points: GraphPoint[];
  seriesNames: string[];
}

export function OddsGraph({ points, seriesNames }: OddsGraphProps) {
  if (points.length === 0) {
    return <div className="text-sm text-slate-400">No votes yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={points}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} unit="%" domain={[0, 100]} />
        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
        <Legend />
        {seriesNames.map((name, index) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 7: Implement `src/components/MarketStats.tsx`**

```tsx
interface MarketStatsProps {
  volume: number;
  endDate: string;
}

export function MarketStats({ volume, endDate }: MarketStatsProps) {
  return (
    <div className="flex justify-between text-sm text-slate-300">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Volume</div>
        <div>{volume} guesses</div>
      </div>
      <div className="text-right">
        <div className="text-xs uppercase tracking-wide text-slate-500">Ends</div>
        <div>{endDate}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Replace `src/app/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { NameCapture } from '@/components/NameCapture';
import { VoteOptions } from '@/components/VoteOptions';
import { OddsGraph } from '@/components/OddsGraph';
import { MarketStats } from '@/components/MarketStats';
import { getOrCreateDeviceId, getStoredName, storeName, clearIdentity } from '@/lib/deviceCookie';
import { MARKET_END_LABEL } from '@/lib/config';
import type { MarketResponse } from '@/lib/types';

export default function Home() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [nextResetAt, setNextResetAt] = useState<string | null>(null);
  const [marketClosed, setMarketClosed] = useState(false);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
    setName(getStoredName());
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
        <p className="text-sm text-slate-400">Vote once a day. Change your mind as often as you want.</p>
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
      )}

      {market && <MarketStats volume={market.volume} endDate={MARKET_END_LABEL} />}
    </main>
  );
}
```

- [ ] **Step 9: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests across every task pass.

- [ ] **Step 10: Commit**

```bash
git add src/components/NameCapture.tsx src/components/VoteOptions.tsx src/components/OddsGraph.tsx src/components/MarketStats.tsx src/app/page.tsx src/components/NameCapture.test.tsx src/components/VoteOptions.test.tsx
git commit -m "feat: build Polymarket-style market page UI"
```

---

### Task 9: Supabase/Vercel Setup and Manual Smoke Test

**Files:**
- Modify: none (external service configuration + manual verification only)

**Interfaces:**
- Consumes: everything from Tasks 1–8.
- Produces: a deployed, working app.

- [ ] **Step 1: Create the Supabase project (manual, in the Supabase dashboard)**

Go to supabase.com, create a free project (e.g. named `dublymarket`), then open its SQL Editor and run the contents of `supabase/schema.sql` to create the `votes` table.

- [ ] **Step 2: Collect Supabase credentials**

In the Supabase dashboard, go to Project Settings → API. Copy the "Project URL" and the "service_role" secret key.

- [ ] **Step 3: Create local env file**

Run: `cp .env.local.example .env.local`
Then edit `.env.local` and paste in the real `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values from Step 2.

- [ ] **Step 4: Manual smoke test against the real database**

Run: `npm run dev`
Open `http://localhost:3000` in a browser and verify:
- The page loads with the title "What healer will Dub play next season?" and all 9 healer options listed at 0%.
- Entering a name and clicking a healer records a vote: the page shows "Voting as [Name]", the clicked option's percentage updates, and Volume increases by 1.
- Clicking another option immediately after shows the "already voted today" message rather than recording a second vote.
- The graph renders with at least one data point after the first vote.
- In the Supabase dashboard's Table Editor, confirm a new row exists in `votes` with the correct `device_id`, `voter_name`, `healer`, and `voted_at`.

- [ ] **Step 5: Push to GitHub**

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

- [ ] **Step 6: Deploy to Vercel (manual, in the Vercel dashboard)**

Go to vercel.com, import the GitHub repository, and in the project's Environment Variables settings add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with the same values from Step 2. Deploy.

- [ ] **Step 7: Repeat the Step 4 smoke test against the deployed Vercel URL**

Confirm voting, the once-per-day block, the graph, and the Supabase `votes` table all behave the same way in production as they did locally.
