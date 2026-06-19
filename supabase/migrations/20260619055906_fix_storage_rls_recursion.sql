-- Fix remaining storage RLS policies

DROP POLICY IF EXISTS admin_update_product_images ON storage.objects;
DROP POLICY IF EXISTS admin_delete_product_images ON storage.objects;
DROP POLICY IF EXISTS admin_update_gallery ON storage.objects;
DROP POLICY IF EXISTS admin_delete_gallery ON storage.objects;
DROP POLICY IF EXISTS admin_delete_cottage_images ON storage.objects;

CREATE POLICY "admin_update_product_images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND is_admin());
CREATE POLICY "admin_delete_product_images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND is_admin());
CREATE POLICY "admin_update_gallery" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery' AND is_admin());
CREATE POLICY "admin_delete_gallery" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND is_admin());
CREATE POLICY "admin_update_cottage_images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cottage-images' AND is_admin());
CREATE POLICY "admin_delete_cottage_images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cottage-images' AND is_admin());
CREATE POLICY "admin_update_hall_images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hall-images' AND is_admin());
CREATE POLICY "admin_delete_hall_images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hall-images' AND is_admin());