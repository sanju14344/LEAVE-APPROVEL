-- ============================================
-- NUCLEAR OPTION: Disable RLS Temporarily
-- Run this if the other fixes don't work
-- ============================================

-- WARNING: This disables security temporarily!
-- Only use for testing, then re-enable RLS after fixing

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- After signup works, re-enable with:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Then add proper policies:
--CREATE POLICY "Allow signup" ON profiles FOR INSERT WITH CHECK (true);
