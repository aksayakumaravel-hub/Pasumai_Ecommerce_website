-- Fix RLS recursion - part 2

-- cottage_bookings table
DROP POLICY IF EXISTS select_cottage_bookings ON cottage_bookings;
DROP POLICY IF EXISTS update_cottage_bookings ON cottage_bookings;
DROP POLICY IF EXISTS insert_cottage_bookings ON cottage_bookings;
DROP POLICY IF EXISTS delete_cottage_bookings ON cottage_bookings;

CREATE POLICY "select_cottage_bookings" ON cottage_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "insert_cottage_bookings" ON cottage_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_cottage_bookings" ON cottage_bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "delete_cottage_bookings" ON cottage_bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- farm_visits table
DROP POLICY IF EXISTS select_farm_visits ON farm_visits;
DROP POLICY IF EXISTS update_farm_visits ON farm_visits;
DROP POLICY IF EXISTS insert_farm_visits ON farm_visits;
DROP POLICY IF EXISTS delete_farm_visits ON farm_visits;

CREATE POLICY "select_farm_visits" ON farm_visits FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "insert_farm_visits" ON farm_visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_farm_visits" ON farm_visits FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "delete_farm_visits" ON farm_visits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- hall_bookings table
DROP POLICY IF EXISTS select_hall_bookings ON hall_bookings;
DROP POLICY IF EXISTS select_own_hall_bookings ON hall_bookings;
DROP POLICY IF EXISTS update_hall_bookings ON hall_bookings;
DROP POLICY IF EXISTS insert_hall_bookings ON hall_bookings;
DROP POLICY IF EXISTS delete_hall_bookings ON hall_bookings;

CREATE POLICY "select_hall_bookings" ON hall_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "insert_hall_bookings" ON hall_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_hall_bookings" ON hall_bookings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "delete_hall_bookings" ON hall_bookings FOR DELETE TO authenticated USING (auth.uid() = user_id OR is_admin());