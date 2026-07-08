
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'JOD';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS image_url text;

-- Storage policies for public buckets (buckets created via tool separately)
CREATE POLICY "public read task images" ON storage.objects FOR SELECT USING (bucket_id = 'task-images');
CREATE POLICY "auth upload task images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner delete task images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'task-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "public read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "admin manage banners storage insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage banners storage delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banners' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage banners storage update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'banners' AND public.has_role(auth.uid(),'admin'));
