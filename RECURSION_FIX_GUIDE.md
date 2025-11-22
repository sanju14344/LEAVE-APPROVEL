# 🔄 Fix Infinite Recursion Error

## The Problem
You are seeing "infinite recursion detected" because the database policies are getting stuck in a loop (e.g., "Check if I'm an admin" -> "Look at profiles table" -> "Check if I'm an admin" -> ...).

## The Solution
I have created a script `FIX_RECURSION.sql` that:
1. **Wipes ALL existing policies** on `profiles` and `leave_requests` (to be safe).
2. **Recreates them using JWT Metadata**. This is the key fix. Instead of querying the database to check your role, it checks the secure token you're already logged in with. This breaks the loop.

## 🛠️ INSTRUCTIONS

1.  **Open Supabase SQL Editor**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  **Copy & Paste** the content of `FIX_RECURSION.sql`.
3.  **Click RUN**.

## ✅ Verification
1.  Refresh your app.
2.  The red error banner should disappear.
3.  Try sending a leave request - it should work now because the policies are fixed.
