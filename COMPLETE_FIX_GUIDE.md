# 🚨 FIX: Table Creation Error & Permissions

## The Error
The error `violates check constraint "profiles_role_check"` happens because the database was strictly set to only allow 'staff' or 'admin' roles. It didn't know 'pc' was allowed!

## The Solution
I created a **Master Fix Script** (`COMPLETE_FIX.sql`) that solves everything at once:

1.  **Fixes the Error**: Updates the database to allow 'pc' as a valid role.
2.  **Fixes Permissions**: Allows Admins to appoint PCs.
3.  **Enables Workflow**: Allows PCs and Admins to approve/decline requests.

## 🛠️ INSTRUCTIONS (Do this now)

1.  **Open Supabase SQL Editor**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  **Copy & Paste** the content of `COMPLETE_FIX.sql`.
3.  **Click RUN**.

## ✅ Verification
1.  Go back to **Admin Panel -> Users**.
2.  Click **Appoint as PC**.
3.  **It will work now!** No red error box.
4.  The user will stay as "Program Coordinator" even after reload.
