-- =================================================================
-- FORCE ALLOW USER DELETION - The "Nuclear" Option (v2)
-- Run this in Supabase SQL Editor
-- =================================================================

-- 1. Fix 'profiles' table (Link to auth.users)
-- First, explicitly drop the standard name to avoid collision
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- Find and drop ANY OTHER FK linking profiles -> auth.users
    FOR r IN 
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'profiles' 
          AND ccu.table_name = 'users' 
          AND ccu.table_schema = 'auth'
    LOOP 
        RAISE NOTICE 'Dropping constraint: %', r.constraint_name;
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(r.constraint_name); 
    END LOOP; 
END $$;

-- Enable Cascade Delete
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;


-- 2. Fix 'leave_requests' table (Links to auth.users)
-- Explicitly drop standard names
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_pc_reviewed_by_fkey;
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_declined_by_fkey;

DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- Find and drop ANY FK linking leave_requests -> auth.users
    FOR r IN 
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'leave_requests' 
          AND ccu.table_name = 'users' 
          AND ccu.table_schema = 'auth'
    LOOP 
        RAISE NOTICE 'Dropping constraint: %', r.constraint_name;
        EXECUTE 'ALTER TABLE public.leave_requests DROP CONSTRAINT ' || quote_ident(r.constraint_name); 
    END LOOP; 
END $$;

-- Re-add constraints with SET NULL
ALTER TABLE public.leave_requests
ADD CONSTRAINT leave_requests_pc_reviewed_by_fkey
FOREIGN KEY (pc_reviewed_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

ALTER TABLE public.leave_requests
ADD CONSTRAINT leave_requests_declined_by_fkey
FOREIGN KEY (declined_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;


-- 3. Fix 'leave_requests' -> 'profiles' (requested_by)
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_requested_by_fkey;

DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN 
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'leave_requests' 
          AND kcu.column_name = 'requested_by'
    LOOP 
        RAISE NOTICE 'Dropping constraint: %', r.constraint_name;
        EXECUTE 'ALTER TABLE public.leave_requests DROP CONSTRAINT ' || quote_ident(r.constraint_name); 
    END LOOP; 
END $$;

ALTER TABLE public.leave_requests
ADD CONSTRAINT leave_requests_requested_by_fkey
FOREIGN KEY (requested_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
