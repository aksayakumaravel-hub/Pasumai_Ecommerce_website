-- Fix RLS recursion - part 4

-- notifications table
DROP POLICY IF EXISTS admin_manage_notifications ON notifications;
DROP POLICY IF EXISTS select_notifications ON notifications;
DROP POLICY IF EXISTS insert_notifications ON notifications;
DROP POLICY IF EXISTS update_notifications ON notifications;
DROP POLICY IF EXISTS delete_notifications ON notifications;

CREATE POLICY "select_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "update_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- cottages table
DROP POLICY IF EXISTS public_read_cottages ON cottages;
DROP POLICY IF EXISTS admin_manage_cottages ON cottages;
DROP POLICY IF EXISTS admin_read_cottages ON cottages;
DROP POLICY IF EXISTS insert_cottages ON cottages;
DROP POLICY IF EXISTS update_cottages ON cottages;
DROP POLICY IF EXISTS delete_cottages ON cottages;

CREATE POLICY "public_read_cottages" ON cottages FOR SELECT TO PUBLIC USING (is_active = true);
CREATE POLICY "admin_read_cottages" ON cottages FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "insert_cottages" ON cottages FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "update_cottages" ON cottages FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "delete_cottages" ON cottages FOR DELETE TO authenticated USING (is_admin());

-- notification_campaigns table
DROP POLICY IF EXISTS admin_manage_campaigns ON notification_campaigns;

CREATE POLICY "admin_manage_campaigns" ON notification_campaigns FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- notification_templates table  
DROP POLICY IF EXISTS admin_manage_templates ON notification_templates;

CREATE POLICY "admin_manage_templates" ON notification_templates FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- storage.objects policies
DROP POLICY IF EXISTS admin_upload_product_images ON storage.objects;
DROP POLICY IF EXISTS admin_upload_gallery ON storage.objects;
DROP POLICY IF EXISTS admin_upload_cottage_images ON storage.objects;
DROP POLICY IF EXISTS admin_upload_hall_images ON storage.objects;

CREATE POLICY "admin_upload_product_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND is_admin());
CREATE POLICY "admin_upload_gallery" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND is_admin());
CREATE POLICY "admin_upload_cottage_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cottage-images' AND is_admin());
CREATE POLICY "admin_upload_hall_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hall-images' AND is_admin());