-- Fix all RLS policies that recursively query profiles table
-- Replace all inline admin checks with the is_admin() SECURITY DEFINER function

-- products table
DROP POLICY IF EXISTS insert_products ON products;
DROP POLICY IF EXISTS update_products ON products;
DROP POLICY IF EXISTS delete_products ON products;
DROP POLICY IF EXISTS public_read_products ON products;
DROP POLICY IF EXISTS admin_manage_products ON products;

CREATE POLICY "public_read_products" ON products FOR SELECT TO PUBLIC USING (is_active = true);
CREATE POLICY "admin_read_products" ON products FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "insert_products" ON products FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "update_products" ON products FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "delete_products" ON products FOR DELETE TO authenticated USING (is_admin());

-- orders table - drop and recreate
DROP POLICY IF EXISTS select_own_orders ON orders;
DROP POLICY IF EXISTS update_own_orders ON orders;
DROP POLICY IF EXISTS insert_own_orders ON orders;
DROP POLICY IF EXISTS delete_own_orders ON orders;

CREATE POLICY "select_own_orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "insert_own_orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_orders" ON orders FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "delete_own_orders" ON orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- order_items table
DROP POLICY IF EXISTS select_order_items ON order_items;
DROP POLICY IF EXISTS update_order_items ON order_items;
DROP POLICY IF EXISTS insert_order_items ON order_items;
DROP POLICY IF EXISTS delete_order_items ON order_items;

CREATE POLICY "select_order_items" ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin())));
CREATE POLICY "insert_order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin())));
CREATE POLICY "update_order_items" ON order_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "delete_order_items" ON order_items FOR DELETE TO authenticated USING (is_admin());