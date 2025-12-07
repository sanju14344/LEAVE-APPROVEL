-- =================================================================
-- ALLOW USER DELETION (FINAL FIX) - Run in Supabase SQL Editor
-- =================================================================

-- 1. Fix 'profiles' table (Link to auth.users)
-- We want the profile to be deleted when the user is deleted.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Fix 'leave_requests' (Links to auth.users)
-- The columns 'pc_reviewed_by' and 'declined_by' link to auth.users.
-- We DON'T want to delete the leave request if an Admin/PC is deleted.
-- Instead, we set these fields to NULL to keep the record.

-- Fix: pc_reviewed_by
ALTER TABLE public.leave_requests
DROP CONSTRAINT IF EXISTS leave_requests_pc_reviewed_by_fkey;

ALTER TABLE public.leave_requests
ADD CONSTRAINT leave_requests_pc_reviewed_by_fkey
FOREIGN KEY (pc_reviewed_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Fix: declined_by
ALTER TABLE public.leave_requests
DROP CONSTRAINT IF EXISTS leave_requests_declined_by_fkey;

ALTER TABLE public.leave_requests
ADD CONSTRAINT leave_requests_declined_by_fkey
FOREIGN KEY (declined_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- 3. Fix 'leave_requests' (Link to profiles)
-- The 'requested_by' column usually links to profiles(id).
-- If the profile is deleted (because user was deleted), we delete the request.
ALTER TABLE public.leave_requests
DROP CONSTRAINT IF EXISTS leave_requests_requested_by_fkey;

ALTER TABLE public.leave_requests
ADD CONSTRAINT leave_requests_requested_by_fkey
FOREIGN KEY (requested_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- =================================================================
-- VERIFY
-- =================================================================
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    rc.delete_rule 
FROM 
    information_schema.table_constraints AS tc
JOIN 
    information_schema.referential_constraints AS rc 
    ON tc.constraint_name = rc.constraint_name
WHERE 
    tc.table_name IN ('profiles', 'leave_requests') 
    AND tc.constraint_type = 'FOREIGN KEY';
