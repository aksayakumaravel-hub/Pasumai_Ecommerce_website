
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin_select_profiles" ON profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  is_organic BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_products" ON products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "insert_products" ON products FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "update_products" ON products FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "delete_products" ON products FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT DEFAULT 'upi',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  delivery_address TEXT,
  delivery_name TEXT,
  delivery_phone TEXT,
  estimated_delivery TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_orders" ON orders FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "insert_own_orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_orders" ON orders FOR UPDATE TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "delete_own_orders" ON orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Order items
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_order_items" ON order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "insert_order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "update_order_items" ON order_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "delete_order_items" ON order_items FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

-- Cottage bookings
CREATE TABLE cottage_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  cottage_type TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cottage_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_cottage_bookings" ON cottage_bookings FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "insert_cottage_bookings" ON cottage_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_cottage_bookings" ON cottage_bookings FOR UPDATE TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "delete_cottage_bookings" ON cottage_bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Farm visit bookings
CREATE TABLE farm_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT NOT NULL,
  visitor_email TEXT,
  visit_type TEXT NOT NULL,
  visit_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  group_size INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE farm_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_farm_visits" ON farm_visits FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "insert_farm_visits" ON farm_visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_farm_visits" ON farm_visits FOR UPDATE TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "delete_farm_visits" ON farm_visits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Contact messages
CREATE TABLE contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_contact_messages" ON contact_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "insert_contact_messages" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_contact_messages" ON contact_messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "delete_contact_messages" ON contact_messages FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Gallery media
CREATE TABLE gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_gallery" ON gallery_items FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "insert_gallery" ON gallery_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "update_gallery" ON gallery_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "delete_gallery" ON gallery_items FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed default products
INSERT INTO products (name, description, price, original_price, category, image_url, stock, unit, is_organic, rating, reviews_count) VALUES
('Taiwan Pink Guava', 'Sweet and juicy Taiwan Pink Guava freshly harvested from our organic farm. Rich in Vitamin C and antioxidants.', 120, 150, 'Fruits', 'https://images.pexels.com/photos/1120575/pexels-photo-1120575.jpeg', 50, 'kg', true, 4.8, 124),
('Nattu Guava', 'Traditional country guava with a unique earthy flavor. Organically grown without pesticides.', 80, 100, 'Fruits', 'https://images.pexels.com/photos/5945559/pexels-photo-5945559.jpeg', 40, 'kg', true, 4.7, 89),
('Black Country Chicken', 'Free-range black country chicken raised naturally on our farm. Superior taste and nutrition.', 350, 400, 'Poultry', 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg', 20, 'kg', true, 4.9, 67),
('Fresh Spinach', 'Farm-fresh organic spinach harvested daily. Rich in iron and nutrients.', 40, 55, 'Vegetables', 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg', 100, 'bunch', true, 4.6, 203),
('Organic Farm Eggs', 'Free-range organic eggs from our happy hens. Rich in protein and omega-3.', 180, 210, 'Eggs & Dairy', 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg', 200, 'tray (30)', true, 4.9, 315),
('Farm Fresh Vegetables Box', 'A curated box of seasonal organic vegetables fresh from our farm. Includes tomatoes, brinjal, drumstick, and more.', 250, 320, 'Vegetables', 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg', 30, 'box', true, 4.7, 156),
('Homemade Moringa Powder', 'Pure organic moringa powder made from fresh drumstick leaves. Superfood packed with nutrients.', 220, 280, 'Organic Products', 'https://images.pexels.com/photos/6157049/pexels-photo-6157049.jpeg', 60, '100g', true, 4.8, 78),
('Country Tomatoes', 'Vine-ripened country tomatoes with natural sweetness and rich flavor.', 60, 80, 'Vegetables', 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg', 80, 'kg', true, 4.5, 142);

-- Seed gallery items
INSERT INTO gallery_items (title, description, media_url, media_type, category) VALUES
('Green Farm Fields', 'Lush green fields of our organic farm', 'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg', 'image', 'Farm'),
('Sunrise at the Farm', 'Golden sunrise over our peaceful farm', 'https://images.pexels.com/photos/1227513/pexels-photo-1227513.jpeg', 'image', 'Nature'),
('Organic Harvest', 'Fresh organic harvest ready for delivery', 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg', 'image', 'Products'),
('Cottage Stay', 'Our premium eco cottage with garden view', 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg', 'image', 'Cottage'),
('Swimming Pool', 'Refreshing swimming pool amidst nature', 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg', 'image', 'Amenities'),
('Farm Animals', 'Our happy animals grazing freely', 'https://images.pexels.com/photos/735968/pexels-photo-735968.jpeg', 'image', 'Animals'),
('Garden Party Hall', 'Open garden party hall for events', 'https://images.pexels.com/photos/1543762/pexels-photo-1543762.jpeg', 'image', 'Events'),
('Conference Hall', 'AC conference meeting hall', 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg', 'image', 'Events'),
('Guava Orchard', 'Beautiful guava orchard at peak harvest', 'https://images.pexels.com/photos/5945559/pexels-photo-5945559.jpeg', 'image', 'Farm'),
('Fresh Vegetables', 'Morning harvest of organic vegetables', 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg', 'image', 'Products'),
('Farm Pond', 'Serene farm pond reflecting clear skies', 'https://images.pexels.com/photos/460621/pexels-photo-460621.jpeg', 'image', 'Nature'),
('Evening at the Farm', 'Magical evening view of the farm', 'https://images.pexels.com/photos/289347/pexels-photo-289347.jpeg', 'image', 'Nature');
