
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_trade_pl() FROM PUBLIC, anon, authenticated;

-- Storage policies: each user manages their own folder inside trade-screenshots
CREATE POLICY "Users read own screenshots" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own screenshots" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own screenshots" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own screenshots" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
