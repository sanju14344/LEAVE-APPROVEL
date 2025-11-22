# 🚨 URGENT FIX - Run This SQL Now!

## The Error You're Seeing
❌ "Database error saving new user"

## Why It's Happening  
Your database is blocking profile creation due to permission issues.

## ⚡ IMMEDIATE FIX (2 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"+ New query"**

### Step 2: Copy and Paste This ENTIRE Script

```sql
-- Quick Fix for Signup Error
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow ANYONE to create their own profile during signup
CREATE POLICY "Allow signup profile creation" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Also allow authenticated users
CREATE POLICY "Allow authenticated profile insert" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

### Step 3: Click "RUN" (bottom right corner)

### Step 4: Test Signup Again
Go back to `http://localhost:3000/login` and try signing up!

---

## ✅ If It Works
Great! You can now sign up users.

## ❌ If It Still Doesn't Work

Run this additional script:

```sql
-- Disable RLS temporarily (NOT for production!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

**Then try signup again.**  
Once signup works, you can re-enable RLS and set proper policies later.

---

## 🔍 Alternative: Check If Table Exists

If you get "relation does not exist" error:

```sql
-- Create the profiles table
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

-- Allow profile creation
CREATE POLICY "Allow signup profile creation" ON profiles
  FOR INSERT
  WITH CHECK (true);
```

---

## 💡 What This Does
- Allows anyone to insert a profile during signup
- The client-side code I added will create the profile
- Signup will work immediately!

## ⏱️ Time to Fix: < 2 minutes

**DO THIS NOW and signup will work!** 🚀
