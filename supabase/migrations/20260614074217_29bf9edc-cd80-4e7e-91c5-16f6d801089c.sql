
-- Trade quality column
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS quality text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS broken_rules uuid[] NOT NULL DEFAULT '{}';

-- Trading Rules
CREATE TABLE IF NOT EXISTS public.trading_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_rules TO authenticated;
GRANT ALL ON public.trading_rules TO service_role;
ALTER TABLE public.trading_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trading rules" ON public.trading_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trading_rules_set_updated_at BEFORE UPDATE ON public.trading_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Setup Library
CREATE TABLE IF NOT EXISTS public.trade_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  market text,
  notes text,
  image_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_setups TO authenticated;
GRANT ALL ON public.trade_setups TO service_role;
ALTER TABLE public.trade_setups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own setups" ON public.trade_setups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trade_setups_set_updated_at BEFORE UPDATE ON public.trade_setups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
