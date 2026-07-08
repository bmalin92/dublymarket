# Dublymarket — Design Spec

**Date:** 2026-07-07
**Status:** Approved, pending implementation plan

## Summary

A joke Polymarket-style prediction market for Dub's World of Warcraft guild. There is exactly one market: "What healer will Dub play next season?" Guildmates vote once per day (no accounts) on which of 9 options they think Dub will main, and can change their guess daily. The market closes Aug 12, 2026, at which point Dub reviews the raw vote data (exported from Supabase) to determine winners.

## Goals

- Let guildmates vote daily without creating an account.
- Persist votes durably, keyed to device (not account), so a device's voting history survives across visits.
- Preserve every vote ever cast — a new day's vote never overwrites a previous one.
- Show a Polymarket-style single-market page: live odds, a percentage-over-time graph, volume, and an end date.
- Let Dub (as admin) pull the full raw vote history at any time to determine winners, without building custom admin tooling.

## Non-Goals

- User accounts, login, or auth of any kind for voters.
- Real-money or point-based betting mechanics — this is a guess-tracking joke app, not a wagering system.
- In-app admin UI for managing options, end date, or exporting data — these are handled via hardcoded config and the Supabase dashboard.
- Strong anti-cheat / bot prevention — this is an honor-system app for a friend group; device ID + IP are soft signals, not security guarantees.

## Options (hardcoded)

The 9 choices voters pick between:

1. Holy Priest
2. Discipline Priest
3. Restoration Druid
4. Restoration Shaman
5. Holy Paladin
6. Mistweaver Monk
7. Preservation Evoker
8. Bard Hunter (joke option)
9. DPS (Dub gives up healing entirely)

Changing this list requires editing app config and redeploying.

## Architecture

- **Frontend + API:** Next.js, deployed free on Vercel.
- **Database:** Supabase (Postgres), free tier.
- **Business logic location:** all vote validation, the 5AM ET cutoff, and odds/graph computation happen server-side in Next.js API routes — the client never talks to Supabase directly. This keeps the daily-cutoff and tallying logic in one place rather than duplicated in RLS policies, and keeps it harder to bypass via browser devtools than a client-side Supabase call would be.
- **Admin access:** none built into the app. Dub logs into the Supabase web dashboard directly to view/export the `votes` table as CSV.

## Data Model

Single table, `votes`, in Supabase Postgres:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / serial | primary key |
| `device_id` | text | UUID generated client-side on first visit, stored in a long-lived cookie |
| `ip_address` | text | captured server-side from the request; soft backstop only, never blocks a vote by itself |
| `voter_name` | text | self-reported, no uniqueness constraint — two devices can claim the same name |
| `healer` | text | one of the 9 hardcoded option values |
| `voted_at` | timestamptz | server-set at insert time |

Every vote is a new row. Nothing is ever updated or deleted by the app itself. This is what makes the percentage-over-time graph and the end-of-tier export possible.

No `devices` or `users` table — "remembering" a name/device across visits is purely a browser cookie concern (`dublymarket_device_id`, `dublymarket_name`), not a server-side identity system.

## Vote Flow

1. **Page load:** client checks for `dublymarket_device_id` cookie. If absent, generate a UUID client-side and set a long-lived cookie (~5 years). If `dublymarket_name` cookie is also present, UI shows "Voting as [Name]" with a "not you?" link that clears both cookies.
2. **First-time voters** (no name cookie) see a name input inline above the options before they can cast their first vote.
3. **Casting a vote** — `POST /api/vote` with `{ device_id, name, healer }`:
   - Server computes the current "voting day": the most recent 5:00 AM US Eastern boundary. Anything from 5:00 AM ET onward counts as today; anything before counts as the prior day's window.
   - Server queries `votes` for a row matching this `device_id` with `voted_at` inside the current voting-day window.
     - **Exists:** reject with an error indicating they've already voted today; response includes time remaining until the next 5AM ET reset.
     - **Does not exist:** insert a new row (`device_id`, `ip_address` from the request, `name`, `healer`, `now()`).
   - Response includes freshly recomputed odds so the client can update immediately without a second request.
4. **After the market closes** (past Aug 12, 2026 ET): `/api/vote` rejects all requests regardless of device/day state. UI shows a "Market closed" banner instead of vote controls, while odds/graph/volume remain visible as a final snapshot.

## Odds & Graph Computation

- **Live odds** (`GET /api/market`): tally **every vote ever cast** (not just each device's latest), grouped by `healer`, as a percentage of total votes. This is an explicit choice — repeated votes for the same healer compound rather than being deduplicated to "current stance per voter."
- **Volume:** total count of all votes cast, all-time — same total used as the odds denominator.
- **Percentage-over-time graph:** votes are grouped into daily buckets on 5AM ET boundaries. For each day since market open, compute the cumulative percentage each healer held as of that day (same all-votes-ever-cast methodology, just evaluated at each historical cutoff). Response is limited to:
  - The 5 healers with the highest **current** percentage, each as its own series.
  - The remaining 4 options summed into a single "Other" series.
  - The top-5 ranking is fixed per request/page-load — it does not reshuffle live as data refreshes underneath an open page.
- **Caching:** none — `/api/market` computes fresh from Postgres on every call. Traffic is guild-sized, not a concern at this scale.

## Frontend Layout

Single responsive page, styled like an individual Polymarket bet page:

- **Top:** market title ("What healer will Dub play next season?") plus short flavor text.
- **Left column:** all 9 options listed with live percentage and a proportional fill/bar. Each option is a vote target (button or clickable row). If the current device has already voted today, options render disabled/greyed with a banner: "You voted for [X] today — resets in Hh Mm." If the market is closed, a "Market closed" banner replaces vote controls entirely.
- **Right column:** the percentage-over-time line graph (top 5 + "Other"), with a legend.
- **Bottom-left:** Volume — total votes cast, all-time.
- **Bottom-right:** End date — "Market closes Aug 12, 2026."
- **Name capture:** inline input for first-time voters; "Voting as [Name] · not you?" for returning devices.

## Deployment

- Vercel free tier for the Next.js app.
- Supabase free tier for Postgres.
- Supabase connection string/keys stored as Vercel environment variables — never committed to the repo.

## Open Items for Dub (post-launch, not blocking implementation)

- Exact flavor text / subtitle copy for the market page.
- Visual styling details (colors, fonts) beyond "looks like a Polymarket bet page."
