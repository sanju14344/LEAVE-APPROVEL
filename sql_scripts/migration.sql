-- ============================================
-- Two-Tier Approval System - Database Migration (FIXED)
-- Execute these queries in order in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Drop Old Status Check Constraint
-- ============================================

ALTER TABLE leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_status_check;

-- ============================================
-- STEP 2: Add New Status Check Constraint
-- ============================================

ALTER TABLE leave_requests
ADD CONSTRAINT leave_requests_status_check 
CHECK (status IN ('pending_pc', 'pending_admin', 'approved', 'declined', 'pending'));

-- ============================================
-- STEP 3: Create Profiles Table
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'pc', 'admin')),
  stream TEXT NOT NULL CHECK (stream IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create Indexes for Profiles
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_stream ON profiles(stream);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_stream_role ON profiles(stream, role);

-- ============================================
-- STEP 5: Enable Row Level Security on Profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Drop ALL Existing Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins view stream users" ON profiles;
DROP POLICY IF EXISTS "Admins update stream users" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- ============================================
-- STEP 7: Create SIMPLIFIED RLS Policies (No Recursion)
-- ============================================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Admins and PCs can view all users in their stream
-- FIXED: Use user_metadata directly, don't query profiles table
CREATE POLICY "Admins view stream users" ON profiles
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'pc')
  );

-- Policy 3: Admins can update users in their stream
-- FIXED: Use user_metadata directly
CREATE POLICY "Admins update stream users" ON profiles
  FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'stream') = stream
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Policy 4: Allow inserts for new user signups
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 8: Update Leave Requests Table
-- ============================================

ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS pc_reviewed_by UUID REFERENCES auth.users(id);

ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS pc_reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES auth.users(id);

-- ============================================
-- STEP 9: Create Indexes for Leave Requests
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_pc_reviewed ON leave_requests(pc_reviewed_by);
CREATE INDEX IF NOT EXISTS idx_leave_requests_stream_status ON leave_requests(stream, status);

-- ============================================
-- STEP 10: Create Function to Sync User Metadata
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, stream)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    COALESCE(NEW.raw_user_meta_data->>'stream', 'CSE')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    stream = EXCLUDED.stream,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 11: Create Trigger for Auto-Sync
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 12: Migrate Existing Users
-- ============================================

INSERT INTO profiles (id, email, full_name, role, stream)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  COALESCE(raw_user_meta_data->>'role', 'staff') as role,
  COALESCE(raw_user_meta_data->>'stream', 'CSE') as stream
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  stream = EXCLUDED.stream,
  updated_at = NOW();

-- ============================================
-- STEP 13: Update Existing Leave Requests Status
-- ============================================

-- Update existing pending requests to pending_pc if there's a PC in that stream
UPDATE leave_requests
SET status = 'pending_pc'
WHERE status = 'pending'
AND stream IN (
  SELECT DISTINCT stream 
  FROM profiles 
  WHERE role = 'pc'
);

-- For streams without PC, set to pending_admin
UPDATE leave_requests
SET status = 'pending_admin'
WHERE status = 'pending';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check profiles table
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 10;

-- Check leave_requests columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- Count users by role and stream
SELECT stream, role, COUNT(*) 
FROM profiles 
GROUP BY stream, role 
ORDER BY stream, role;

-- Check leave request statuses
SELECT status, COUNT(*) 
FROM leave_requests 
GROUP BY status;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
