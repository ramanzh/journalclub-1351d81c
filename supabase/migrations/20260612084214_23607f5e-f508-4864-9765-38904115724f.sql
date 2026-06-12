
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS daily_drawdown_limit numeric,
  ADD COLUMN IF NOT EXISTS max_drawdown_limit numeric,
  ADD COLUMN IF NOT EXISTS profit_target_1 numeric,
  ADD COLUMN IF NOT EXISTS profit_target_2 numeric;

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
