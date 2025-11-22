-- =================================================================
-- FIX PERMISSIONS & WORKFLOW - Run this in Supabase SQL Editor
-- =================================================================

-- 1. ENABLE ADMINS TO APPOINT PCs (Update Profiles)
-- We drop the old policy to be sure, then add a permissive one for Admins.
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 2. ENABLE PCs TO APPROVE REQUESTS (Update Leave Requests)
-- PCs need to be able to update status from 'pending_pc' to 'pending_admin' or 'declined'
-- They should only be able to update requests in their stream.
DROP POLICY IF EXISTS "PCs can update requests in their stream" ON leave_requests;

CREATE POLICY "PCs can update requests in their stream"
ON leave_requests FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'pc' 
  AND 
  (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
);

-- 3. ENABLE ADMINS TO APPROVE REQUESTS (Update Leave Requests)
-- Admins need to update status from 'pending_admin' to 'approved' or 'declined'
DROP POLICY IF EXISTS "Admins can update requests in their stream" ON leave_requests;

CREATE POLICY "Admins can update requests in their stream"
ON leave_requests FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  AND 
  (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
);

-- 4. VERIFY & FIX TRIGGER PERMISSIONS (Just in case)
-- Ensure the handle_new_user trigger has permission to write to profiles
ALTER FUNCTION handle_new_user() SECURITY DEFINER;
