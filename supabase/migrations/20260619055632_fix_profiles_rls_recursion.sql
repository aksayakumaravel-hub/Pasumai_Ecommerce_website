-- Fix infinite recursion in profiles RLS policy
-- The admin_select_profiles policy was causing recursion by querying profiles within the policy

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS admin_select_profiles ON profiles;

-- For admin access to all profiles, use a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Create a new non-recursive admin select policy using the helper function
CREATE POLICY "admin_select_all_profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin() OR auth.uid() = id);

-- Drop the old select_own_profile policy since admin_select_all_profiles covers both cases
DROP POLICY IF EXISTS select_own_profile ON profiles;