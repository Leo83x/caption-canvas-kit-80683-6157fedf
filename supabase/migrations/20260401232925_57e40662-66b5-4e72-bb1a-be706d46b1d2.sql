
-- Create the image-library storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('image-library', 'image-library', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for image-library"
ON storage.objects FOR SELECT
USING (bucket_id = 'image-library');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to image-library"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'image-library' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own files
CREATE POLICY "Users can update own files in image-library"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'image-library' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files in image-library"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'image-library' AND auth.uid()::text = (storage.foldername(name))[1]);
