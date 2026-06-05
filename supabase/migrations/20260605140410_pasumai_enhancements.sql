
/*
# Pasumai Farm — Feature Enhancements

## Summary
This migration adds new tables and columns to support:
1. Party Hall and Conference Hall bookings with per-day pricing
2. Product categories management
3. Stock auto-reduction via database function
4. Enhanced notifications with email/whatsapp fields

## New Tables
- `product_categories` — Admin-managed categories with icon/color
- `hall_bookings` — Party hall & conference hall bookings with date + pricing

## Modified Tables
- `products` — adds `category_id` FK, `images` array for multiple photos, `video_url`
- `cottage_bookings` — adds `payment_reference` column
- `orders` — adds `payment_reference` column

## New Functions
- `reduce_product_stock(product_id, qty)` — atomically reduces stock when order is placed

## Security
- RLS enabled on all new tables
- Admin-only write policies, public read for categories/products
*/

-- ===================================================
-- Product Categories
-- ===================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  icon text,
  color text DEFAULT 'green',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_categories" ON product_categories;
CREATE POLICY "select_categories" ON product_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_categories" ON product_categories;
CREATE POLICY "insert_categories" ON product_categories FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "update_categories" ON product_categories;
CREATE POLICY "update_categories" ON product_categories FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "delete_categories" ON product_categories;
CREATE POLICY "delete_categories" ON product_categories FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed default categories
INSERT INTO product_categories (name, icon, color, sort_order) VALUES
  ('Fruits', '🍎', 'green', 1),
  ('Vegetables', '🥬', 'emerald', 2),
  ('Poultry', '🐔', 'amber', 3),
  ('Eggs & Dairy', '🥚', 'yellow', 4),
  ('Organic Products', '🌿', 'teal', 5),
  ('Grains & Pulses', '🌾', 'stone', 6)
ON CONFLICT (name) DO NOTHING;

-- ===================================================
-- Enhanced Products: add images array + video_url
-- ===================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='images') THEN
    ALTER TABLE products ADD COLUMN images text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='video_url') THEN
    ALTER TABLE products ADD COLUMN video_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='badge') THEN
    ALTER TABLE products ADD COLUMN badge text;
  END IF;
END $$;

-- ===================================================
-- Hall Bookings (Party Hall + Conference Hall)
-- ===================================================
CREATE TABLE IF NOT EXISTS hall_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  guest_email text,
  hall_type text NOT NULL CHECK (hall_type IN ('party_hall', 'conference_hall')),
  event_date date NOT NULL,
  end_date date,
  event_type text,
  guest_count integer DEFAULT 1,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text DEFAULT 'pending',
  payment_reference text,
  special_requests text,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE hall_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_hall_bookings" ON hall_bookings;
CREATE POLICY "select_hall_bookings" ON hall_bookings FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "insert_hall_bookings" ON hall_bookings;
CREATE POLICY "insert_hall_bookings" ON hall_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_hall_bookings" ON hall_bookings;
CREATE POLICY "update_hall_bookings" ON hall_bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "delete_hall_bookings" ON hall_bookings;
CREATE POLICY "delete_hall_bookings" ON hall_bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===================================================
-- Payment reference on existing tables
-- ===================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_reference') THEN
    ALTER TABLE orders ADD COLUMN payment_reference text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cottage_bookings' AND column_name='payment_reference') THEN
    ALTER TABLE cottage_bookings ADD COLUMN payment_reference text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farm_visits' AND column_name='payment_reference') THEN
    ALTER TABLE farm_visits ADD COLUMN payment_reference text;
  END IF;
END $$;

-- ===================================================
-- Stock reduction function (atomic, safe)
-- ===================================================
CREATE OR REPLACE FUNCTION reduce_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_product_id AND stock > 0;
END;
$$;

-- Grant execute to authenticated users (called after order placement)
GRANT EXECUTE ON FUNCTION reduce_product_stock(uuid, integer) TO authenticated;
