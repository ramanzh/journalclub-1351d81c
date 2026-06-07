
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trades
CREATE TYPE public.trade_side AS ENUM ('buy', 'sell');
CREATE TYPE public.asset_market AS ENUM ('forex', 'crypto', 'stock');

CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  market public.asset_market NOT NULL DEFAULT 'forex',
  side public.trade_side NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  position_size NUMERIC NOT NULL,
  profit_loss NUMERIC,
  screenshot_url TEXT,
  emotion_before TEXT,
  emotion_after TEXT,
  mistakes TEXT,
  lessons TEXT,
  notes TEXT,
  trade_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trades" ON public.trades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX trades_user_id_idx ON public.trades(user_id);
CREATE INDEX trades_user_date_idx ON public.trades(user_id, trade_date DESC);

-- Auto P/L + updated_at
CREATE OR REPLACE FUNCTION public.compute_trade_pl()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.exit_price IS NOT NULL THEN
    IF NEW.side = 'buy' THEN
      NEW.profit_loss = (NEW.exit_price - NEW.entry_price) * NEW.position_size;
    ELSE
      NEW.profit_loss = (NEW.entry_price - NEW.exit_price) * NEW.position_size;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trades_compute_pl
BEFORE INSERT OR UPDATE ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.compute_trade_pl();

-- Profile auto-create
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
