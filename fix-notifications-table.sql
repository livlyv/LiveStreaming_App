-- Fix notifications table by adding missing 'read' column
-- Run this in your Supabase SQL Editor

-- Add the missing 'read' column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Update existing notifications to have read = false
UPDATE notifications 
SET read = FALSE 
WHERE read IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'read';

-- Show the current notifications table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
