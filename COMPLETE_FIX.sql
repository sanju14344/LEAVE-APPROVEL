-- =================================================================
-- COMPLETE FIX: CONSTRAINTS & PERMISSIONS
-- Run this in Supabase SQL Editor to fix ALL issues
-- =================================================================

-- 1. FIX THE "CHECK CONSTRAINT" ERROR (Allow 'pc' role)
-- The error you saw happened because the database didn't know 'pc' was a valid role.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('staff', 'pc', 'admin'));

-- 2. ENABLE ADMINS TO APPOINT PCs (Update Profiles)
-- Allow admins to actually save these changes to the database.
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 3. ENABLE PCs & ADMINS TO APPROVE REQUESTS
-- Allow PCs and Admins to update the status of leave requests.
DROP POLICY IF EXISTS "PCs can update requests in their stream" ON leave_requests;
CREATE POLICY "PCs can update requests in their stream"
ON leave_requests FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'pc' 
  AND 
  (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
);

DROP POLICY IF EXISTS "Admins can update requests in their stream" ON leave_requests;
CREATE POLICY "Admins can update requests in their stream"
ON leave_requests FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  AND 
  (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
);

-- 4. FIX TRIGGER PERMISSIONS
-- Ensure the signup trigger works correctly.
ALTER FUNCTION handle_new_user() SECURITY DEFINER;
