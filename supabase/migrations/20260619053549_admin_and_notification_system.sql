/*
# Admin Auto-Assignment and Notification System

## Changes
1. Auto-assign admin role to specific emails on profile creation
2. Create notification preferences table
3. Create notification campaigns table
4. Add push subscription tracking
5. Create functions for notification management
*/

-- Auto-assign admin role to specific emails
CREATE OR REPLACE FUNCTION auto_assign_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the email matches admin list
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = NEW.id 
    AND email IN ('aksayakumaravel@gmail.com', 'mkumaran3577@gmail.com')
  ) THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_create ON profiles;
CREATE TRIGGER on_profile_create
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_admin_role();

-- Update existing profiles for admin emails
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('aksayakumaravel@gmail.com', 'mkumaran3577@gmail.com')
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  delivery_updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  farm_updates BOOLEAN DEFAULT true,
  booking_updates BOOLEAN DEFAULT true,
  payment_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_manage_prefs" ON notification_preferences;
CREATE POLICY "user_manage_prefs" ON notification_preferences FOR ALL
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id) 
  VALUES (NEW.id) 
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_create_prefs ON profiles;
CREATE TRIGGER on_user_create_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_prefs();

-- Push subscriptions table (for web push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  device_type TEXT DEFAULT 'browser',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_manage_push" ON push_subscriptions;
CREATE POLICY "user_manage_push" ON push_subscriptions FOR ALL
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification campaigns (admin-initiated)
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'promotion',
  target_group TEXT DEFAULT 'all',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_campaigns" ON notification_campaigns;
CREATE POLICY "admin_manage_campaigns" ON notification_campaigns FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_templates" ON notification_templates;
CREATE POLICY "admin_manage_templates" ON notification_templates FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default notification templates
INSERT INTO notification_templates (name, title, message, category, variables) VALUES
  ('order_placed', 'Order Placed!', 'Your order #{order_id} has been placed successfully. Total: ₹{amount}', 'order', ARRAY['order_id', 'amount']),
  ('payment_received', 'Payment Received!', 'Payment of ₹{amount} for order #{order_id} has been confirmed.', 'payment', ARRAY['amount', 'order_id']),
  ('order_confirmed', 'Order Confirmed', 'Your order #{order_id} has been confirmed and is being prepared.', 'order', ARRAY['order_id']),
  ('order_shipped', 'Order Shipped', 'Your order #{order_id} is on the way! Track your delivery.', 'delivery', ARRAY['order_id']),
  ('order_delivered', 'Order Delivered!', 'Your order #{order_id} has been delivered successfully. Enjoy your organic products!', 'delivery', ARRAY['order_id']),
  ('booking_confirmed', 'Booking Confirmed!', 'Your {booking_type} booking for {date} has been confirmed.', 'booking', ARRAY['booking_type', 'date']),
  ('cart_reminder', 'Items in Cart', 'You left fresh products in your cart. Complete your order before they sell out!', 'promotion', ARRAY[]::TEXT[]),
  ('inactive_user', 'We Miss You!', 'It''s been a while since your last order. Fresh arrivals are waiting for you!', 'promotion', ARRAY[]::TEXT[]),
  ('reorder_reminder', 'Running Low?', 'Time to restock your organic essentials. Reorder in one click!', 'promotion', ARRAY[]::TEXT[])
ON CONFLICT (name) DO NOTHING;

-- Add read_at to notifications for analytics
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'info';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
