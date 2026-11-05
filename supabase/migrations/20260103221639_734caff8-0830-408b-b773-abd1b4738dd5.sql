-- Create storage bucket for vendor photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-photos', 'vendor-photos', true);

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own vendor photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view vendor photos (public bucket)
CREATE POLICY "Anyone can view vendor photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own vendor photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vendor-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);