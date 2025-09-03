-- Add password column to users table if it doesn't exist
-- Run this in your Supabase SQL editor

-- Check if password column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password TEXT;
        RAISE NOTICE 'Password column added to users table';
    ELSE
        RAISE NOTICE 'Password column already exists in users table';
    END IF;
END $$;
