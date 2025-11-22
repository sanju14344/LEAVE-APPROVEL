-- =================================================================
-- FIX INFINITE RECURSION - Run this in Supabase SQL Editor
-- =================================================================

-- 1. Drop ALL existing policies on profiles table to ensure a clean slate
-- We use a dynamic block to catch any policy name we might have missed
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname); 
    END LOOP; 
END $$;

-- 2. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create SAFE, NON-RECURSIVE policies
-- Critical: We use auth.jwt() -> 'user_metadata' for role checks
-- This avoids querying the profiles table to check permissions, preventing recursion

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 4: Admins/PCs can view users in their stream
-- We check the JWT metadata, NOT the profiles table
CREATE POLICY "Admins view stream users" ON profiles
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'pc')
  );

-- Policy 5: Service role has full access
CREATE POLICY "Service role full access" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Fix Leave Requests Policies (Just in case)
-- Ensure leave_requests doesn't cause recursion by querying profiles incorrectly

DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'leave_requests' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON leave_requests', pol.policyname); 
    END LOOP; 
END $$;

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/create their own requests
CREATE POLICY "Users own requests" ON leave_requests
  FOR ALL
  USING (auth.uid() = requested_by)
  WITH CHECK (auth.uid() = requested_by);

-- Policy: Admins/PCs can view requests in their stream
CREATE POLICY "Staff view stream requests" ON leave_requests
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'pc')
  );

-- Policy: Admins/PCs can update requests in their stream
CREATE POLICY "Staff update stream requests" ON leave_requests
  FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'pc')
  );
