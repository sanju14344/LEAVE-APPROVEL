-- =================================================================
-- ENABLE JOIN WITH PROFILES - Run this in Supabase SQL Editor
-- =================================================================

-- 1. Drop the existing FK to auth.users (if we can find its name, otherwise we force it)
-- We'll try to drop the constraint by name if we know it, or just add a new one.
-- Usually Supabase names it leave_requests_requested_by_fkey

ALTER TABLE leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_requested_by_fkey;

-- 2. Add FK to profiles table (Public schema)
-- This allows us to do .select('*, profiles(full_name)') in the API
ALTER TABLE leave_requests
ADD CONSTRAINT leave_requests_requested_by_fkey
FOREIGN KEY (requested_by)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 3. Verify
SELECT 
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='leave_requests';
