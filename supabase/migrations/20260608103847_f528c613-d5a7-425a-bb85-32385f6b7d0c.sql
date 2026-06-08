
-- Account type enum
CREATE TYPE public.account_type AS ENUM ('demo', 'prop', 'real');

-- Accounts table
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  account_type public.account_type NOT NULL DEFAULT 'demo',
  initial_balance numeric NOT NULL DEFAULT 0,
  broker text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own accounts" ON public.accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Journal entries
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  image_url text,
  entry_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal" ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Favorite instruments
CREATE TABLE public.favorite_instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market public.asset_market NOT NULL,
  symbol text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market, symbol)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorite_instruments TO authenticated;
GRANT ALL ON public.favorite_instruments TO service_role;
ALTER TABLE public.favorite_instruments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorite_instruments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trades: add account, risk %, P/L %
ALTER TABLE public.trades
  ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN risk_percent numeric,
  ADD COLUMN profit_loss_percent numeric;

-- Updated trigger that also sets P/L percent based on account initial_balance
CREATE OR REPLACE FUNCTION public.compute_trade_pl()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base numeric;
BEGIN
  NEW.updated_at = now();
  IF NEW.exit_price IS NOT NULL THEN
    IF NEW.side = 'buy' THEN
      NEW.profit_loss = (NEW.exit_price - NEW.entry_price) * NEW.position_size;
    ELSE
      NEW.profit_loss = (NEW.entry_price - NEW.exit_price) * NEW.position_size;
    END IF;

    IF NEW.account_id IS NOT NULL THEN
      SELECT initial_balance INTO base FROM public.accounts WHERE id = NEW.account_id;
      IF base IS NOT NULL AND base > 0 THEN
        NEW.profit_loss_percent = (NEW.profit_loss / base) * 100;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trades_compute_pl ON public.trades;
CREATE TRIGGER trades_compute_pl
  BEFORE INSERT OR UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.compute_trade_pl();

-- updated_at triggers for new tables
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER journal_entries_updated_at BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
