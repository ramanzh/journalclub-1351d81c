
CREATE POLICY "Users read own setup images" ON storage.objects FOR SELECT
  USING (bucket_id = 'setup-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own setup images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'setup-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own setup images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'setup-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own setup images" ON storage.objects FOR DELETE
  USING (bucket_id = 'setup-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
