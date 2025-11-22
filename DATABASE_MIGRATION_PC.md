# Database Migration for Two-Tier Approval System

## Step 1: Create Profiles Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'pc', 'admin')),
  stream TEXT NOT NULL CHECK (stream IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_profiles_stream ON profiles(stream);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_stream_role ON profiles(stream, role);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can view all users in their stream
CREATE POLICY "Admins view stream users" ON profiles
  FOR SELECT
  USING (
    stream = (auth.jwt() -> 'user_metadata' ->> 'stream')
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'pc')
  );

-- Policy: Admins can update users in their stream (for role changes)
CREATE POLICY "Admins update stream users" ON profiles
  FOR UPDATE
  USING (
    stream = (auth.jwt() -> 'user_metadata' ->> 'stream')
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Policy: Allow inserts for new user signups
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Step 2: Update Leave Requests Table

```sql
-- Add PC review columns
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS pc_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS pc_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add declined_by column to track who declined
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_pc_reviewed ON leave_requests(pc_reviewed_by);
CREATE INDEX IF NOT EXISTS idx_leave_requests_stream_status ON leave_requests(stream, status);
```

## Step 3: Create Function to Sync User Metadata to Profiles

This function automatically creates/updates profile when user signs up:

```sql
-- Function to handle new user signup
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

-- Trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 4: Migrate Existing Users (If Any)

If you have existing users in auth.users, run this to populate profiles:

```sql
-- Migrate existing users to profiles table
INSERT INTO profiles (id, email, full_name, role, stream)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  COALESCE(raw_user_meta_data->>'role', 'staff') as role,
  COALESCE(raw_user_meta_data->>'stream', 'CSE') as stream
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

## Step 5: Update Existing Leave Requests Status

If you have existing leave requests with 'pending' status, update them:

```sql
-- Update existing pending requests
-- This sets them to pending_pc if there's a PC in that stream, otherwise pending_admin
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
```

## Verification Queries

After running the migration, verify with these queries:

```sql
-- Check profiles table
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 10;

-- Check leave_requests columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leave_requests';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Count users by role and stream
SELECT stream, role, COUNT(*) 
FROM profiles 
GROUP BY stream, role 
ORDER BY stream, role;
```

## Status Values Reference

After migration, leave requests will use these statuses:

| Status | Description |
|--------|-------------|
| `pending_pc` | Waiting for PC approval (first tier) |
| `pending_admin` | PC approved, waiting for Admin (second tier) |
| `approved` | Admin approved (final approval) |
| `declined` | Declined by PC or Admin |

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove new columns from leave_requests
ALTER TABLE leave_requests 
DROP COLUMN IF EXISTS pc_reviewed_by,
DROP COLUMN IF EXISTS pc_reviewed_at,
DROP COLUMN IF EXISTS declined_by;

-- Drop profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

## Next Steps

After running this migration:

1. Test user signup to verify profile creation
2. Check that existing users appear in profiles table
3. Verify RLS policies work correctly
4. Test leave request status updates

The application code will be updated to work with these new database structures.
