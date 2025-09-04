-- Fix users table by adding missing columns
-- Run this in your Supabase SQL Editor

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_withdrawal_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_document_url VARCHAR(500);

-- Update existing users to have default values
UPDATE users 
SET 
  first_withdrawal_completed = COALESCE(first_withdrawal_completed, FALSE),
  kyc_status = COALESCE(kyc_status, 'pending')
WHERE first_withdrawal_completed IS NULL OR kyc_status IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('kyc_completed_at', 'first_withdrawal_completed', 'kyc_status', 'kyc_document_url')
ORDER BY column_name;
