-- Add columns to trades
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS setup_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS session text,
  ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '{}'::jsonb;

-- setup_tags table
CREATE TABLE IF NOT EXISTS public.setup_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setup_tags TO authenticated;
GRANT ALL ON public.setup_tags TO service_role;
ALTER TABLE public.setup_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own setup tags" ON public.setup_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- checklist_items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_items TO authenticated;
GRANT ALL ON public.checklist_items TO service_role;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checklist items" ON public.checklist_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
