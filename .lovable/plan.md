# Major Trading Analytics Upgrade — Implementation Plan

A large feature set across DB, trade form, analytics, and a new calendar page. I'll deliver it in one cohesive migration + UI pass while keeping the existing Persian RTL dark theme.

## 1. Database Migration

New tables and columns:

- `trades.setup_tags text[]` (default `{}`)
- `trades.session text` (`london` | `newyork` | `asia` | `overlap` | null)
- `trades.checklist jsonb` (default `{}`) — `{ itemKey: boolean }`
- Expanded enums for emotions (stored as plain text; validated client-side)

New user-scoped tables:
- `setup_tags` — `id, user_id, name, is_default bool, created_at`
- `checklist_items` — `id, user_id, key, label, is_default bool, sort_order, created_at`

Each new table gets: GRANTs to `authenticated` + `service_role`, RLS enabled, "users manage own" policy, `updated_at` trigger where applicable.

Default tags (FVG, SMT, Liquidity Sweep, Breakout, Reversal, Trend Following, S&R, Range, Scalping, Swing) and default checklist items (Trend confirmed, Setup confirmed, Risk within plan, SL defined, Entry follows strategy, Market conditions OK) are seeded lazily per user on first visit via a server-side helper (not migration — keeps it per-user).

## 2. Trade Form Updates (`src/components/trade-form.tsx`)

Add four new field groups:
- **Setup Tags** multi-select chips (with inline "manage tags" dialog: add/edit/delete custom tags).
- **Session** select (London / New York / Asia / Overlap).
- **Emotions Before/After** expanded preset chips (Calm, Confident, Fearful, FOMO, Overconfident, Frustrated, Revenge Trading, Impulsive / Happy, Neutral, Regret, Frustrated, Confident, Angry).
- **Pre-Trade Checklist** — checkbox list rendered from `checklist_items`, stored as `{ key: boolean }` on the trade.

## 3. Analytics Library (`src/lib/trade-utils.ts`)

Add pure functions consumed by dashboards:
- `setupStats(trades)` → per-tag: trades, winRate, avgPL%, avgRisk%
- `sessionStats(trades)` → per-session: trades, winRate, avgRisk, growth%
- `emotionStats(trades, phase)` → per-emotion: winRate, count
- `checklistStats(trades, items)` → withFull vs partial winRate, most-ignored items, discipline score (mean completion %)

## 4. New Routes & Components

- `src/routes/_authenticated/analytics.tsx` — tabs: Setups | Sessions | Psychology | Checklist. Bar charts via recharts + ranked tables.
- `src/routes/_authenticated/calendar.tsx` — monthly grid (Persian months via `Intl`), color-coded days by daily PnL, day-click popover showing trades + notes + summary. Filters: account, market, setup.
- Sidebar additions in `app-shell.tsx`: Calendar, Analytics.

## 5. Custom Tag / Checklist Management

Inline manage dialogs inside trade form (lightweight) + dedicated section on Analytics page for full CRUD.

## Technical Details

- Setup tags stored as `text[]` on trades (denormalized) — fast filtering, no join.
- Sessions stored as plain text — easy enum expansion later.
- Checklist completion % = completedCount/totalItems at submit time, stored in jsonb so historical items remain accurate even if user edits master list.
- All charts use existing `recharts`; reuse `gradient-card` / token colors.
- Calendar built without new deps using `date-fns-jalali`... actually keep it dep-free: compute Persian month grid with `Intl.DateTimeFormat('fa-IR-u-ca-persian')` + manual day iteration on Gregorian dates, labeling with Persian digits.

## Files

**Migration:** 1 new SQL file (schema + RLS + grants).

**Edit:**
- `src/integrations/supabase/types.ts` (after migration regen)
- `src/components/trade-form.tsx`
- `src/lib/trade-utils.ts`
- `src/components/app-shell.tsx`
- `src/routes/_authenticated/dashboard.tsx` (small: link to analytics)

**Create:**
- `src/components/setup-tag-picker.tsx`
- `src/components/checklist-picker.tsx`
- `src/components/emotion-picker.tsx`
- `src/routes/_authenticated/analytics.tsx`
- `src/routes/_authenticated/calendar.tsx`
- `src/lib/seed-defaults.ts` (per-user default tags/checklist seeding)

## Out of Scope (this turn)

- Drag-reorder for checklist items (sort_order editable via simple number input only).
- Export of analytics to PDF/CSV.

Ready to build on approval.