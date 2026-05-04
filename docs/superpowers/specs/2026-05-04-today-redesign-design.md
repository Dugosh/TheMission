# Today Page Redesign

**Date:** 2026-05-04
**Status:** Approved by user, ready for implementation plan

## Goal

Reskin the Today page to match the visual language of the smart-home dashboard reference (rounded cards, icon tiles, big numbers, mini chart) while staying dark, masculine, and mobile-first. Add a 14-day weight sparkline and a day picker for backfill.

## Scope

- **In:** Today page layout, new tile components, weight sparkline, day picker (URL `?d=YYYY-MM-DD`), `lucide-react` icons across all pages.
- **Out:** Goals/Todos/History page restructures (they inherit visual tokens but no layout changes), circular gauges, weekly bar chart, push notifications, reminders, desktop-only sidebar, schema changes.

## Architecture

No changes to schema or server actions. Today page (`src/app/page.tsx`) becomes parameterized by date. New components in `src/components/today/`.

```
src/app/page.tsx                       — reads ?d= param, fetches log for that date, renders sections
src/components/today/Hero.tsx          — greeting + day picker + clean-streak number + compact compliance
src/components/today/WeightCard.tsx    — sparkline + 7-day avg + inline weight input
src/components/today/TileGrid.tsx      — 2-col tile grid, accepts list of tile configs
src/components/today/Tile.tsx          — three variants: toggle | number | pill
src/components/today/NumberSheet.tsx   — slide-up bottom sheet for number entry
```

Existing `DailyLogForm.tsx` is removed; tiles wire directly to `upsertDailyField` server action.

## Tile types

**Toggle tile** — icon, label, big check indicator. One tap = save. Tone:
- Subtractions: green when ON (clean), neutral when unset, red ring when explicitly toggled OFF (broke).
- Additions: green when ON, neutral when unset.

**Number tile** — icon, label, big tabular number, target hint. Tap opens NumberSheet (slide-up) with numpad-friendly input. Glow green when target hit (e.g., steps ≥ 10000, work ≥ 6).

**Pill tile** — icon, label, current selection text. Tap cycles through options, or opens an inline option row for selection.

## Day picker

- URL param `?d=YYYY-MM-DD`. Missing → today (local time, midnight rollover).
- `‹ date ›` row in Hero. Forward arrow disabled when date is today.
- "Today" pill appears when viewing a non-today date; tap to jump back to today.
- Streaks calculated from real today (always), independent of viewed date. Backfilling yesterday will retroactively extend streaks.

## Weight sparkline

- 14-day window (today and prior 13 days).
- SVG path, area fill in emerald with low opacity, line in emerald-400.
- Shows: current 7-day avg (large), delta from 185 lbs start, target line at 145.
- Inline weight input below the chart writes to the *currently viewed* date.

## Visual tokens (Tailwind classes)

- Cards: `rounded-3xl` for hero/weight, `rounded-2xl` for tiles.
- Padding: `p-5` cards, `p-4` tiles.
- Borders: `border border-zinc-800/80` default; active green = `border-emerald-700 bg-emerald-950/40`; broke red = `border-red-800 bg-red-950/30`.
- Typography: tabular-nums for all numeric stats. Labels uppercase tracking-wider text-xs.
- Icons: `lucide-react` 18-20px, `stroke-1.5`.

## Tile inventory

| Section        | Tile                  | Type    | Icon          |
|----------------|-----------------------|---------|---------------|
| Subtractions   | No vape               | Toggle  | CloudOff      |
|                | No porn               | Toggle  | EyeOff        |
|                | No weed               | Toggle  | Cannabis (or Leaf) |
|                | No processed food     | Toggle  | Pizza (slashed)    |
|                | No alcohol            | Toggle  | Wine          |
| Movement       | 10 pull-ups           | Toggle  | ArrowUpFromDot     |
|                | Steps                 | Number  | Footprints    |
|                | Cardio                | Pill    | Heart         |
|                | Lifting               | Pill    | Dumbbell      |
|                | Sauna                 | Toggle  | Flame         |
| Body           | 1 gallon water        | Toggle  | Droplet       |
|                | Eating done by 7:30PM | Toggle  | UtensilsCrossed    |
|                | Focused work          | Number  | Brain         |
| Nutrition      | Meal 1                | Toggle  | Bowl  (or Soup)    |
|                | Meal 2                | Toggle  | Milk          |
|                | Meal 3                | Toggle  | Beef          |
|                | Refeed day            | Toggle  | Carrot        |

## Number sheet behavior

- Slide-up modal, full-width, ~50% height.
- Big numpad-friendly input (`inputMode="decimal"`).
- "Save" button, "Clear" button.
- Auto-focuses on open. Saves on Enter.

## Persistence

Unchanged. Each tile interaction calls `upsertDailyField(date, { [field]: value })`. Optimistic UI: tile updates locally, server action runs in transition, on error reverts.

## Implementation order

1. Install `lucide-react`.
2. Build `Tile` + `NumberSheet` primitives.
3. Build `Hero` with day picker.
4. Build `WeightCard` with SVG sparkline.
5. Build `TileGrid` with hard-coded tile inventory.
6. Wire new `page.tsx` reading `?d=`.
7. Delete `DailyLogForm.tsx`.
8. Sweep Goals/Todos/History to use the same border/radius/icon tokens.

## Success criteria

- Logging today's day still takes <2 minutes on phone.
- Hero shows greeting + clean streak + compliance.
- Weight chart renders for users with ≥2 weigh-ins; shows "—" otherwise.
- Day picker arrows work; future arrow disabled at today.
- All tiles save on tap with no apparent lag.
- Build passes, deploys cleanly via Vercel git integration.
