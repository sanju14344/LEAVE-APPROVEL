-- ================================================================
-- FIX PC APPROVAL FLOW - RLS Policy Update
-- ================================================================
-- Problem: PCs cannot see advisor leave requests because RLS policies
-- check JWT user_metadata (which doesn't exist) instead of profiles table
-- 
-- Solution: Update RLS policies to query profiles table for role/stream
-- ================================================================

-- Drop existing leave_requests policies
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'leave_requests' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON leave_requests', pol.policyname); 
    END LOOP; 
END $$;

-- Re-enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view/create/update/delete their own requests
CREATE POLICY "Users own requests" ON leave_requests
  FOR ALL
  USING (auth.uid() = requested_by)
  WITH CHECK (auth.uid() = requested_by);

-- Policy 2: PCs can view requests in their stream
-- FIXED: Now queries profiles table instead of JWT metadata
CREATE POLICY "PCs view stream requests" ON leave_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'pc'
        AND profiles.stream = leave_requests.stream
    )
  );

-- Policy 3: PCs can update requests in their stream
CREATE POLICY "PCs update stream requests" ON leave_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'pc'
        AND profiles.stream = leave_requests.stream
    )
  );

-- Policy 4: Admins can view requests in their stream
CREATE POLICY "Admins view stream requests" ON leave_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.stream = leave_requests.stream
    )
  );

-- Policy 5: Admins can update requests in their stream
CREATE POLICY "Admins update stream requests" ON leave_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.stream = leave_requests.stream
    )
  );

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leave_requests'
ORDER BY policyname;
