# Signup Database Error - Fix Guide

## Problem
When trying to sign up, you're getting "Database error saving new user". This is caused by the database trigger not having proper permissions to insert into the `profiles` table.

## Root Cause
The trigger function `handle_new_user()` that automatically creates profiles when users sign up needs special permissions to bypass Row Level Security (RLS) policies. Without these permissions, the trigger fails silently.

## Solution

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (in the left sidebar)
3. Click **New Query**

### Step 2: Run the Fix Script
Copy and paste the entire contents of `fix_signup_issue.sql` into the SQL editor and click **Run**.

The script will:
- ✅ Drop and recreate the trigger function with `SECURITY DEFINER`
- ✅ Add proper permission grants
- ✅ Recreate the trigger that runs on user signup
- ✅ Verify the setup

### Step 3: Verify the Fix
After running the script, you should see output confirming:
1. Function created successfully
2. Trigger created successfully
3. Permissions granted

### Step 4: Test Signup Again
1. Go back to your app at `http://localhost:3000/login`
2. Try signing up with a new email
3. The signup should now work without errors

## Alternative: Quick Check

If the above doesn't work, check these common issues:

### Issue 1: Profiles Table Doesn't Exist
Run this to create it:
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'pc', 'admin')),
  stream TEXT NOT NULL CHECK (stream IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Issue 2: Email Confirmation Required
Check if Supabase has email confirmation enabled:
1. Go to **Authentication** → **Providers** → **Email**
2. Under **Email Configuration**, check if "Confirm email" is enabled
3. If enabled, you'll need to confirm the email before the user can log in

### Issue 3: Check Function Permissions
Verify the function has correct security settings:
```sql
SELECT 
  proname as function_name,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

The `security_definer` column should be `true`.

## Need More Help?

### View Detailed Postgres Logs
In Supabase Dashboard:
1. Go to **Logs** → **Postgres Logs**
2. Look for errors around the time you tried to sign up
3. Share any error messages you find

### Test the Trigger Manually
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

## After Fix Checklist
- [ ] Ran `fix_signup_issue.sql` in Supabase SQL Editor
- [ ] Verified function and trigger were created
- [ ] Tested signup with a new email
- [ ] Successfully created an account
- [ ] Able to sign in with the new account
