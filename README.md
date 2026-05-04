# Protocol — Daily Habit + Goal + Todo Tracker

A single-user, password-gated daily tracker. Next.js 16 (App Router) + Supabase + Tailwind v4. Deployed on Vercel.

## What's tracked
- **Subtractions**: vape, porn, weed, processed food, alcohol (yes/no compliance + streaks)
- **Additions**: pull-ups, steps, cardio, lifting, sauna, water, eating cutoff, focused work hours
- **Nutrition**: 3 fixed meals + refeed toggle (compliance only — no macro tracking)
- **Biometrics**: morning weight + 7-day rolling average + linear projection to 145 lbs
- **Goals**: weight, Gosian Media revenue, debt elimination (CC → IRS → student), savings to $100k, online business stage, equity stage
- **Todos**: categories, priority, carry-over
- **History**: GitHub-style calendar, weekly + monthly summaries
- **Export**: CSV dump of everything

## Local dev

```bash
npm install
# Fill in .env.local — see .env.example
npm run dev
```

## Required env vars

| Var                              | Where to get it                                                         |
| -------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project Settings → API                                         |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase project Settings → API → `service_role` (NEVER commit)         |
| `APP_PASSWORD`                   | Whatever you want — what you'll type at the login screen                |
| `SESSION_SECRET`                 | `openssl rand -hex 32`                                                  |

## Deploy to Vercel

1. Push this repo to GitHub.
2. On vercel.com → "New Project" → import the repo.
3. In **Environment Variables**, paste all four from above.
4. Deploy. Visit the URL, enter `APP_PASSWORD`.

## Tech notes

- All DB writes go through Server Actions (`src/app/actions/`) — service role key never reaches the browser.
- Auth: signed HMAC cookie set after password match (60-day expiry). Validated in `src/proxy.ts` (Next 16's renamed middleware).
- Schema: `daily_logs`, `revenue_entries`, `debt_payments`, `savings_snapshots`, `goals_state`, `todos` (in Supabase project `habit-tracker`).
