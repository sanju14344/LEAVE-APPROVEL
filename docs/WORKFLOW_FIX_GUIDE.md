# 🔧 Fix PC Appointment & Approval Workflow

## The Problem
1.  **PC Appointment Not Saving**: The database was blocking Admins from updating user roles due to security policies.
2.  **Approval Workflow Stuck**: PCs and Admins couldn't update the status of leave requests because of missing permissions.

## The Solution
I created a script `FIX_PERMISSIONS_AND_WORKFLOW.sql` that:
1.  **Allows Admins** to update user roles (to appoint PCs).
2.  **Allows PCs** to approve/decline requests (update status).
3.  **Allows Admins** to approve/decline requests (update status).

## 🛠️ INSTRUCTIONS

1.  **Open Supabase SQL Editor**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  **Copy & Paste** the content of `FIX_PERMISSIONS_AND_WORKFLOW.sql`.
3.  **Click RUN**.

## ✅ Verification
1.  **Appoint a PC**: Go to Admin Panel -> Users -> Appoint a Staff as PC. Reload the page. The role should stay as "Program Coordinator".
2.  **Test Workflow**:
    *   Submit a request as Staff/Advisor.
    *   Log in as PC -> Approve it (Status becomes `pending_admin`).
    *   Log in as Admin -> Approve it (Status becomes `approved`).
