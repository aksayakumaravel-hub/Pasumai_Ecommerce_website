-- Fix RLS recursion - part 3

-- contact_messages table
DROP POLICY IF EXISTS select_contact_messages ON contact_messages;
DROP POLICY IF EXISTS update_contact_messages ON contact_messages;
DROP POLICY IF EXISTS delete_contact_messages ON contact_messages;
DROP POLICY IF EXISTS admin_read_contact ON contact_messages;
DROP POLICY IF EXISTS admin_update_contact ON contact_messages;
DROP POLICY IF EXISTS admin_delete_contact ON contact_messages;
DROP POLICY IF EXISTS insert_contact_messages ON contact_messages;

CREATE POLICY "insert_contact_messages" ON contact_messages FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "select_contact_messages" ON contact_messages FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "update_contact_messages" ON contact_messages FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "delete_contact_messages" ON contact_messages FOR DELETE TO authenticated USING (is_admin());

-- gallery_items table
DROP POLICY IF EXISTS insert_gallery ON gallery_items;
DROP POLICY IF EXISTS update_gallery ON gallery_items;
DROP POLICY IF EXISTS delete_gallery ON gallery_items;
DROP POLICY IF EXISTS public_read_gallery ON gallery_items;
DROP POLICY IF EXISTS admin_manage_gallery ON gallery_items;
DROP POLICY IF EXISTS admin_read_gallery ON gallery_items;

CREATE POLICY "public_read_gallery" ON gallery_items FOR SELECT TO PUBLIC USING (is_active = true);
CREATE POLICY "admin_read_gallery" ON gallery_items FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "insert_gallery" ON gallery_items FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "update_gallery" ON gallery_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "delete_gallery" ON gallery_items FOR DELETE TO authenticated USING (is_admin());

-- product_categories table
DROP POLICY IF EXISTS insert_categories ON product_categories;
DROP POLICY IF EXISTS update_categories ON product_categories;
DROP POLICY IF EXISTS delete_categories ON product_categories;
DROP POLICY IF EXISTS admin_manage_categories ON product_categories;
DROP POLICY IF EXISTS public_read_categories ON product_categories;

CREATE POLICY "public_read_categories" ON product_categories FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "insert_categories" ON product_categories FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "update_categories" ON product_categories FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "delete_categories" ON product_categories FOR DELETE TO authenticated USING (is_admin());