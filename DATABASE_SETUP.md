# Database Setup Guide

## Required Database Changes

To enable stream-based access control, you need to add a `stream` column to your `leave_requests` table in Supabase.

### Step 1: Add Stream Column to leave_requests Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add stream column to leave_requests table
ALTER TABLE leave_requests 
ADD COLUMN stream TEXT CHECK (stream IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'));

-- Create index for better query performance
CREATE INDEX idx_leave_requests_stream ON leave_requests(stream);

-- Optional: Set a default stream for existing records (if any)
-- UPDATE leave_requests SET stream = 'CSE' WHERE stream IS NULL;
```

### Step 2: Verify the Changes

After running the SQL, verify that:
1. The `stream` column exists in the `leave_requests` table
2. The column accepts only valid stream values (CSE, ECE, EEE, MECH, CIVIL)
3. The index is created for better performance

### Step 3: Test the Application

1. **Sign up** with different streams:
   - Create a staff account with CSE stream
   - Create an admin account with ECE stream
   - Create another staff account with MECH stream

2. **Test stream isolation**:
   - Login as CSE staff and create leave requests
   - Login as ECE admin and verify you only see ECE requests (none from CSE)
   - Login as CSE staff again and verify you only see CSE requests

### Database Schema

Your `leave_requests` table should now have these columns:

- `id` (uuid, primary key)
- `student_name` (text)
- `student_class` (text)
- `from_date` (date)
- `to_date` (date)
- `reason` (text, nullable)
- `attachment_url` (text, nullable)
- `status` (text: pending/approved/declined)
- `requested_by` (uuid, foreign key to auth.users)
- `reviewed_by` (uuid, nullable)
- `created_at` (timestamp)
- `reviewed_at` (timestamp, nullable)
- **`stream` (text: CSE/ECE/EEE/MECH/CIVIL)** ← NEW

### User Metadata Structure

When users sign up, their metadata includes:
```json
{
  "role": "staff" | "admin",
  "full_name": "User Name",
  "stream": "CSE" | "ECE" | "EEE" | "MECH" | "CIVIL"
}
```

### Handling Existing Data

If you have existing leave requests without a stream:

**Option 1: Assign default stream**
```sql
UPDATE leave_requests SET stream = 'CSE' WHERE stream IS NULL;
```

**Option 2: Delete old requests**
```sql
DELETE FROM leave_requests WHERE stream IS NULL;
```

**Option 3: Make stream nullable temporarily**
```sql
-- Remove the NOT NULL constraint if you added it
ALTER TABLE leave_requests ALTER COLUMN stream DROP NOT NULL;
```

## Storage Bucket

Ensure your Supabase storage bucket `leave_attachments` is configured:
1. Go to Storage in Supabase Dashboard
2. Create bucket named `leave_attachments` (if not exists)
3. Set it to **Public** for easy access to attachments
4. Configure appropriate RLS policies if needed

## Testing Checklist

- [ ] Stream column added to leave_requests table
- [ ] Index created for performance
- [ ] Storage bucket configured
- [ ] Signed up users with different streams
- [ ] Created leave requests from different streams
- [ ] Verified stream isolation (CSE staff can't see ECE requests)
- [ ] Tested admin approval workflow
- [ ] Tested file attachments
- [ ] Verified mobile responsiveness
- [ ] Tested all animations and UI effects

## Troubleshooting

### Issue: "column stream does not exist"
**Solution**: Run the ALTER TABLE command in Step 1

### Issue: "violates check constraint"
**Solution**: Ensure you're only using valid stream values: CSE, ECE, EEE, MECH, CIVIL

### Issue: Users see all requests regardless of stream
**Solution**: Check that:
1. The stream column exists in the database
2. Users have stream in their user_metadata
3. The filter query includes `.eq("stream", userStream)`

### Issue: Existing users don't have stream in metadata
**Solution**: They need to sign up again, or you can manually update their metadata in Supabase Auth dashboard
