# 🔗 Enable "Requested By" Feature

## The Change
You wanted to see **"Requested by [Username]"** on the leave requests.
To do this, I updated the code to fetch the user's name from the `profiles` table.

## ⚠️ REQUIRED ACTION
For this to work, you **MUST** run a small SQL script to link the tables together. Without this, the page might show an error or not load the names.

## 🛠️ INSTRUCTIONS

1.  **Open Supabase SQL Editor**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  **Copy & Paste** the content of `ENABLE_PROFILES_JOIN.sql` (from your project folder).
3.  **Click RUN**.

## ✅ Verification
1.  Go to your **Advisor Dashboard** (previously Staff Dashboard).
2.  Look at the leave requests list.
3.  You should now see **"Requested by [Name]"** next to the student name.
