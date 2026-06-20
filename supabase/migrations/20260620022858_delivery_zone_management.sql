-- Delivery Zone Management System
-- Supports multiple hubs with configurable service zones

-- Delivery Hubs table
CREATE TABLE IF NOT EXISTS delivery_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT DEFAULT 'Tamil Nadu',
  pincode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Areas (villages, towns, areas)
CREATE TABLE IF NOT EXISTS service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES delivery_hubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('village', 'town', 'city', 'area')),
  district TEXT,
  pincode TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Zone Configuration
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES delivery_hubs(id) ON DELETE CASCADE,
  max_distance_km DECIMAL(6, 2) NOT NULL DEFAULT 30,
  min_delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 30,
  per_km_charge DECIMAL(10, 2) NOT NULL DEFAULT 2,
  free_delivery_min_order DECIMAL(10, 2) DEFAULT 500,
  estimated_delivery_hours INT DEFAULT 24,
  bulk_order_threshold DECIMAL(10, 2) DEFAULT 5000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supported Pincodes
CREATE TABLE IF NOT EXISTS supported_pincodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES delivery_hubs(id) ON DELETE CASCADE,
  pincode TEXT NOT NULL,
  delivery_charge DECIMAL(10, 2),
  estimated_days INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hub_id, pincode)
);

-- User Delivery Addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Home',
  full_name TEXT,
  phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  district TEXT,
  state TEXT DEFAULT 'Tamil Nadu',
  pincode TEXT NOT NULL,
  landmark TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  is_serviceable BOOLEAN DEFAULT null,
  nearest_hub_id UUID REFERENCES delivery_hubs(id),
  delivery_charge DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders: add delivery hub assignment
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_hub_id UUID REFERENCES delivery_hubs(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_id UUID REFERENCES user_addresses(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_snapshot JSONB;

-- Enable RLS
ALTER TABLE delivery_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "public_read_hubs" ON delivery_hubs FOR SELECT TO PUBLIC USING (is_active = true);
CREATE POLICY "admin_manage_hubs" ON delivery_hubs FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public_read_areas" ON service_areas FOR SELECT TO PUBLIC USING (is_active = true);
CREATE POLICY "admin_manage_areas" ON service_areas FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public_read_zones" ON delivery_zones FOR SELECT TO PUBLIC USING (is_active = true);
CREATE POLICY "admin_manage_zones" ON delivery_zones FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public_read_pincodes" ON supported_pincodes FOR SELECT TO PUBLIC USING (is_active = true);
CREATE POLICY "admin_manage_pincodes" ON supported_pincodes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "select_own_addresses" ON user_addresses FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "insert_own_addresses" ON user_addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_addresses" ON user_addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_addresses" ON user_addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Insert default hubs
INSERT INTO delivery_hubs (name, address, city, district, state, pincode, is_primary, latitude, longitude, phone) VALUES
('Paravai Hub', 'Pasumai Farm Outlet, Main Road', 'Paravai', 'Madurai', 'Tamil Nadu', '625401', true, 9.8833, 78.0833, '9952814029'),
('Kalladipatti Hub', 'Pasumai Integrated Farm, Kalladipatti', 'Kalladipatti', 'Dindigul', 'Tamil Nadu', '624219', true, 10.3500, 77.8500, '9952814029');

-- Insert default zones
INSERT INTO delivery_zones (hub_id, max_distance_km, min_delivery_charge, per_km_charge, free_delivery_min_order, estimated_delivery_hours)
SELECT id, 50, 30, 2, 500, 24 FROM delivery_hubs;

-- Insert supported pincodes for Paravai Hub (Madurai district)
INSERT INTO supported_pincodes (hub_id, pincode, delivery_charge, estimated_days)
SELECT id, pin, 30 + (idx * 5), 1 FROM delivery_hubs h, unnest(ARRAY['625001','625002','625003','625004','625005','625006','625007','625008','625009','625010','625011','625012','625013','625014','625015','625016','625017','625018','625019','625020','625401','625402','625403','625404','625405','625406','625407','625408','625409']) WITH ORDINALITY AS t(pin, idx)
WHERE h.name = 'Paravai Hub';

-- Insert supported pincodes for Kalladipatti Hub (Dindigul district)
INSERT INTO supported_pincodes (hub_id, pincode, delivery_charge, estimated_days)
SELECT id, pin, 30 + (idx * 5), 1 FROM delivery_hubs h, unnest(ARRAY['624001','624002','624003','624004','624005','624006','624007','624008','624009','624010','624211','624212','624213','624214','624215','624216','624217','624218','624219','624220','624301','624302','624303','624304','624305','624306','624307','624308']) WITH ORDINALITY AS t(pin, idx)
WHERE h.name = 'Kalladipatti Hub';

-- Insert service areas
INSERT INTO service_areas (hub_id, name, type, district)
SELECT id, 'Paravai', 'town', 'Madurai' FROM delivery_hubs WHERE name = 'Paravai Hub';

INSERT INTO service_areas (hub_id, name, type, district)
SELECT id, area, 'village', 'Madurai' FROM delivery_hubs h, unnest(ARRAY['Thirumangalam','Thiruparankundram','Chellampatti','Kallikudi','Vadipatti','Melur','Kottampatti']) AS t(area)
WHERE h.name = 'Paravai Hub';

INSERT INTO service_areas (hub_id, name, type, district)
SELECT id, 'Kalladipatti', 'village', 'Dindigul' FROM delivery_hubs WHERE name = 'Kalladipatti Hub';

INSERT INTO service_areas (hub_id, name, type, district)
SELECT id, area, 'village', 'Dindigul' FROM delivery_hubs h, unnest(ARRAY['Palani','Oddanchatram','Vedasandur','Natham','Sithayankottai','Ambathurai','Reddiarchatram','Athoor','Nilakkottai','Batlagundu']) AS t(area)
WHERE h.name = 'Kalladipatti Hub';

-- Function to check delivery eligibility
CREATE OR REPLACE FUNCTION check_delivery_eligibility(p_pincode TEXT)
RETURNS TABLE(
  is_serviceable BOOLEAN,
  hub_id UUID,
  hub_name TEXT,
  delivery_charge DECIMAL,
  estimated_hours INT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    EXISTS (
      SELECT 1 FROM delivery_zones dz 
      JOIN delivery_hubs dh ON dz.hub_id = dh.id 
      WHERE dh.is_active = true AND dz.is_active = true
    ),
    (
      SELECT sp.hub_id FROM supported_pincodes sp
      JOIN delivery_hubs dh ON sp.hub_id = dh.id
      WHERE sp.pincode = p_pincode AND sp.is_active = true AND dh.is_active = true
      ORDER BY sp.delivery_charge ASC
      LIMIT 1
    ),
    (
      SELECT dh.name FROM supported_pincodes sp
      JOIN delivery_hubs dh ON sp.hub_id = dh.id
      WHERE sp.pincode = p_pincode AND sp.is_active = true AND dh.is_active = true
      ORDER BY sp.delivery_charge ASC
      LIMIT 1
    ),
    (
      SELECT COALESCE(sp.delivery_charge, dz.min_delivery_charge)
      FROM supported_pincodes sp
      JOIN delivery_zones dz ON sp.hub_id = dz.hub_id
      JOIN delivery_hubs dh ON sp.hub_id = dh.id
      WHERE sp.pincode = p_pincode AND sp.is_active = true AND dh.is_active = true AND dz.is_active = true
      ORDER BY sp.delivery_charge ASC
      LIMIT 1
    ),
    (
      SELECT COALESCE(sp.estimated_days * 24, dz.estimated_delivery_hours)
      FROM supported_pincodes sp
      JOIN delivery_zones dz ON sp.hub_id = dz.hub_id
      JOIN delivery_hubs dh ON sp.hub_id = dh.id
      WHERE sp.pincode = p_pincode AND sp.is_active = true AND dh.is_active = true AND dz.is_active = true
      LIMIT 1
    );
$$;