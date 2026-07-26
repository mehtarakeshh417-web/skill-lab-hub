CREATE POLICY "Students manage own project files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Teachers read school project files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1
      FROM public.teachers t
      JOIN public.students s ON s.school_id = t.school_id
      WHERE t.user_id = auth.uid()
        AND s.user_id::text = (storage.foldername(name))[1]
    )
  );