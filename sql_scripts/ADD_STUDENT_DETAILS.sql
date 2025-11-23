-- =================================================================
-- ADD STUDENT DETAILS COLUMNS
-- Run this in Supabase SQL Editor
-- =================================================================

ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS reg_no TEXT,
ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2), -- Allows values like 9.85
ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC(5,2); -- Allows values like 85.50
