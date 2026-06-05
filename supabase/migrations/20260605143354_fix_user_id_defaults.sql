/*
# Fix user_id defaults and RLS for all booking/order tables

## Problem
All tables (orders, cottage_bookings, farm_visits, hall_bookings, notifications) 
had no DEFAULT on user_id. The INSERT policies check auth.uid() = user_id, 
but since user_id was NULL, every insert failed with RLS violation.

## Changes
1. Add DEFAULT auth.uid() to user_id on all affected tables
2. Fix notifications INSERT to allow any authenticated user to insert for themselves
3. Ensure products table has permissive RLS for reading (shop page)
4. Allow anon to read products and gallery items
*/

-- Fix user_id defaults
ALTER TABLE orders ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE cottage_bookings ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE farm_visits ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE hall_bookings ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE notifications ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Fix notifications policies - users need to insert their own
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications" ON notifications FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Admin can also read/write all notifications
DROP POLICY IF EXISTS "admin_manage_notifications" ON notifications;
CREATE POLICY "admin_manage_notifications" ON notifications FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Products: allow anon+auth to read active products (shop works without login)
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
TO anon, authenticated USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Gallery: allow anon+auth to read active items
DROP POLICY IF EXISTS "public_read_gallery" ON gallery_items;
CREATE POLICY "public_read_gallery" ON gallery_items FOR SELECT
TO anon, authenticated USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Product categories: public read
DROP POLICY IF EXISTS "public_read_categories" ON product_categories;
CREATE POLICY "public_read_categories" ON product_categories FOR SELECT
TO anon, authenticated USING (true);

-- Admin full access to products
DROP POLICY IF EXISTS "admin_manage_products" ON products;
CREATE POLICY "admin_manage_products" ON products FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Admin full access to gallery
DROP POLICY IF EXISTS "admin_manage_gallery" ON gallery_items;
CREATE POLICY "admin_manage_gallery" ON gallery_items FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Admin full access to categories
DROP POLICY IF EXISTS "admin_manage_categories" ON product_categories;
CREATE POLICY "admin_manage_categories" ON product_categories FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Contact messages: anyone can insert (contact form), admin can read/update/delete
DROP POLICY IF EXISTS "anon_insert_contact" ON contact_messages;
CREATE POLICY "anon_insert_contact" ON contact_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_contact" ON contact_messages;
CREATE POLICY "admin_read_contact" ON contact_messages FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "admin_update_contact" ON contact_messages;
CREATE POLICY "admin_update_contact" ON contact_messages FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "admin_delete_contact" ON contact_messages;
CREATE POLICY "admin_delete_contact" ON contact_messages FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Hall bookings: users insert their own, admin can manage all
DROP POLICY IF EXISTS "insert_own_hall_bookings" ON hall_bookings;
CREATE POLICY "insert_own_hall_bookings" ON hall_bookings FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_hall_bookings" ON hall_bookings;
CREATE POLICY "select_own_hall_bookings" ON hall_bookings FOR SELECT
TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "update_hall_bookings" ON hall_bookings;
CREATE POLICY "update_hall_bookings" ON hall_bookings FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
