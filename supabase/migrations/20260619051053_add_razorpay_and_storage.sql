/*
# Add Razorpay payment fields and storage buckets

## Changes
1. Add Razorpay order ID and payment ID fields to orders, cottage_bookings, farm_visits, hall_bookings
2. Create storage buckets for media uploads (products, gallery, cottages)
3. Create cottages table for dynamic cottage management
4. Add admin full access policies for storage
*/

-- Add Razorpay fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Add Razorpay fields to cottage_bookings
ALTER TABLE cottage_bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE cottage_bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE cottage_bookings ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE cottage_bookings ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Add Razorpay fields to farm_visits
ALTER TABLE farm_visits ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE farm_visits ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE farm_visits ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Add Razorpay fields to hall_bookings (payment_reference already added)
ALTER TABLE hall_bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE hall_bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE hall_bookings ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Create cottages table for dynamic management
CREATE TABLE IF NOT EXISTS cottages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10,2) NOT NULL,
  max_guests INTEGER DEFAULT 2,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  amenities TEXT[] DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cottages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_cottages" ON cottages;
CREATE POLICY "public_read_cottages" ON cottages FOR SELECT
TO anon, authenticated USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "admin_manage_cottages" ON cottages;
CREATE POLICY "admin_manage_cottages" ON cottages FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create storage buckets (via insert)
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-images', 'product-images', true),
  ('gallery', 'gallery', true),
  ('cottage-images', 'cottage-images', true),
  ('hall-images', 'hall-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product-images
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "admin_upload_product_images" ON storage.objects;
CREATE POLICY "admin_upload_product_images" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "admin_update_product_images" ON storage.objects;
CREATE POLICY "admin_update_product_images" ON storage.objects FOR UPDATE
TO authenticated USING (
  bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "admin_delete_product_images" ON storage.objects;
CREATE POLICY "admin_delete_product_images" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create storage policies for gallery
DROP POLICY IF EXISTS "public_read_gallery" ON storage.objects;
CREATE POLICY "public_read_gallery" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "admin_upload_gallery" ON storage.objects;
CREATE POLICY "admin_upload_gallery" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'gallery' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "admin_update_gallery" ON storage.objects;
CREATE POLICY "admin_update_gallery" ON storage.objects FOR UPDATE
TO authenticated USING (
  bucket_id = 'gallery' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "admin_delete_gallery" ON storage.objects;
CREATE POLICY "admin_delete_gallery" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'gallery' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create storage policies for cottage-images
DROP POLICY IF EXISTS "public_read_cottage_images" ON storage.objects;
CREATE POLICY "public_read_cottage_images" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'cottage-images');

DROP POLICY IF EXISTS "admin_upload_cottage_images" ON storage.objects;
CREATE POLICY "admin_upload_cottage_images" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'cottage-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "admin_delete_cottage_images" ON storage.objects;
CREATE POLICY "admin_delete_cottage_images" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'cottage-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default cottages
INSERT INTO cottages (name, description, price_per_night, max_guests, images, amenities, rating, reviews_count, sort_order) VALUES
  ('Garden View Cottage', 'A cozy cottage with lush garden views, perfect for couples and solo travelers seeking peace.', 2999, 2, ARRAY['https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg', 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg'], ARRAY['Queen Bed', 'AC', 'Hot Water', 'Garden View', 'Pool Access', 'Farm Breakfast'], 4.9, 87, 1),
  ('Family Farm Cottage', 'Spacious family cottage with extra beds, ideal for families wanting a complete farm experience.', 4999, 6, ARRAY['https://images.pexels.com/photos/2351649/pexels-photo-2351649.jpeg', 'https://images.pexels.com/photos/1227513/pexels-photo-1227513.jpeg'], ARRAY['2 Bedrooms', 'AC', 'Hot Water', 'Farm View', 'Pool Access', 'Campfire', 'Organic Breakfast'], 4.8, 124, 2),
  ('Luxury Eco Suite', 'Our premium suite with panoramic farm views, private garden, and exclusive amenities.', 7999, 4, ARRAY['https://images.pexels.com/photos/1179156/pexels-photo-1179156.jpeg', 'https://images.pexels.com/photos/289347/pexels-photo-289347.jpeg'], ARRAY['King Bed', 'AC', 'Jacuzzi', 'Private Garden', 'Pool Access', 'Campfire', 'Chef Breakfast', 'Farm Tour'], 5.0, 43, 3)
ON CONFLICT DO NOTHING;
