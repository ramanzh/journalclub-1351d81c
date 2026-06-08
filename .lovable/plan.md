# Multi-Account Trading Workspace

Transform the app from single-table trade journal into a full trader workspace with accounts, equity curves, a free-form journal, an instrument picker with favorites, and percentage-based performance everywhere.

## 1. Database changes (one migration)

New tables (all with GRANT to authenticated + service_role, RLS scoped to `auth.uid()`):

- `accounts` — `id, user_id, name, account_type ('demo'|'prop'|'real'), initial_balance numeric, broker text null, created_at, updated_at`
- `journal_entries` — `id, user_id, title, content text (rich HTML), image_url text null, entry_date timestamptz, created_at, updated_at`
- `favorite_instruments` — `id, user_id, market ('forex'|'crypto'|'stock'), symbol text, created_at` + unique `(user_id, market, symbol)`

Alter `trades`:
- Add `account_id uuid null references accounts(id) on delete set null` (nullable so users can log trades without an account)
- Add `risk_percent numeric null` (for risk display)
- Add `profit_loss_percent numeric null` — computed by trigger: `profit_loss / account.initial_balance * 100` when account_id set, else null

New storage bucket: `journal-images` (private, RLS by user folder).

## 2. New routes

```
src/routes/_authenticated/
  accounts.index.tsx        — list/create accounts (cards)
  accounts.$id.tsx          — single account: stats + equity curve + its trades
  journal.index.tsx         — notes list + search + sort
  journal.new.tsx           — create note (rich editor)
  journal.$id.tsx           — edit/view note
  dashboard.tsx             — redesigned (global equity curve)
  trades.new.tsx            — adds account selector + new instrument picker
  trades.index.tsx          — show %, account badge
```

Nav in `app-shell`: داشبورد · حساب‌ها · معاملات · ژورنال.

## 3. Equity curve

Replace monthly bar chart with `recharts` `LineChart` (Area+Line, smooth, green stroke).
Build series client-side: sort closed trades by `trade_date`, running balance starts at `initial_balance` (or sum of all accounts' initial balances on global dashboard), each point = balance after that trade.

## 4. Instrument picker (`src/components/instrument-picker.tsx`)

- Receives `market`; renders curated list from a constants file (`src/lib/instruments.ts` — the lists from the spec).
- Heart toggle per item → upserts/deletes `favorite_instruments`.
- Favorites pinned to top, separator, rest alphabetical.
- Also allows free-text entry for custom symbols.

## 5. Trade form fixes

- Rename label "نام دارایی" → "ارز / ابزار".
- Replace text input with `<InstrumentPicker>`.
- Exit price placeholder `"0.00"` (currently `"باز"`).
- New "حساب" select (optional, لیست accounts + "بدون حساب").
- Optional "ریسک (%)" input.

## 6. Percentage-based performance

`trade-utils.ts`:
- `computeStats` uses `profit_loss_percent` when present, falls back to `profit_loss / initial_balance` if account loaded.
- New helpers: `formatPercent(n)`, `accountStats(account, trades)` returning `{ currentBalance, growthPct, winRate, total, avgRisk, avgReturnPct }`.

Dashboard cards and trades table show `+5.0%` / `-2.4%` (green/red). Raw $ kept only in trade detail page as secondary text.

## 7. Journal page

- Rich editor: use `@tiptap/react` + `@tiptap/starter-kit` (already lightweight) with toolbar (bold/italic/heading/list/link).
- Image upload to `journal-images` bucket, inserted as `<img>`.
- List: card per entry with title, date, snippet (stripped HTML, 160 chars), search input filters client-side.
- Sort: date desc/asc toggle.

## 8. Theme/RTL

No theme change — keep existing black/green/red tokens. All new components use semantic tokens. New pages wrapped in `<AppShell>`.

## Technical notes

- New deps: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`.
- Trigger update on trades: extend `compute_trade_pl()` to also set `profit_loss_percent` when `account_id` + initial_balance available.
- Use `useAuth()` hook everywhere for `user.id`.
- All queries through browser supabase client with RLS (no server fns needed).
- Storage bucket created via `supabase--storage_create_bucket`; RLS policies on `storage.objects` restrict to `auth.uid()` folder prefix.

## Out of scope (confirm if you want these too)

- Editing existing trades to assign them to a new account retroactively (will work via existing edit form once account selector exists).
- Multi-currency accounts / FX conversion.
- Exporting reports.
