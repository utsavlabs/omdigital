-- Create the portfolio table
CREATE TABLE portfolio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  category text NOT NULL,
  caption text NOT NULL,
  technical_details text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS) on the portfolio table
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Grant required table permissions to the API roles
GRANT SELECT ON portfolio TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio TO authenticated;

-- Allow public read access (everyone can see the portfolio)
CREATE POLICY "Public profiles are viewable by everyone."
  ON portfolio FOR SELECT
  USING ( true );

-- Allow authenticated users (admin) to insert, update, and delete
CREATE POLICY "Admins can insert portfolio items"
  ON portfolio FOR INSERT
  TO authenticated
  WITH CHECK ( true );

CREATE POLICY "Admins can update portfolio items"
  ON portfolio FOR UPDATE
  TO authenticated
  USING ( true );

CREATE POLICY "Admins can delete portfolio items"
  ON portfolio FOR DELETE
  TO authenticated
  USING ( true );

-- Create a storage bucket for the images (Run this via dashboard if it fails here)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio_images', 'portfolio_images', true);

-- Storage RLS (Allow public read for images)
CREATE POLICY "Public Image Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'portfolio_images' );

-- Storage RLS (Allow authenticated upload, update, delete for images)
CREATE POLICY "Admin Image Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'portfolio_images' );

CREATE POLICY "Admin Image Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'portfolio_images' );

CREATE POLICY "Admin Image Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'portfolio_images' );
