-- Fix gifts table unique constraint issue
-- Run this in your Supabase SQL Editor

-- First, let's check the current structure of the gifts table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'gifts'
ORDER BY ordinal_position;

-- Check if there's a unique constraint on the name column
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'gifts'::regclass;

-- If there's no unique constraint on name, add one
ALTER TABLE gifts ADD CONSTRAINT IF NOT EXISTS gifts_name_unique UNIQUE (name);

-- Now try to insert the gifts again
INSERT INTO gifts (name, icon, coins_cost, description) VALUES
('Rose', '🌹', 10, 'A beautiful rose'),
('Heart', '❤️', 50, 'Show your love'),
('Crown', '👑', 100, 'Royal gift'),
('Diamond', '💎', 500, 'Precious diamond'),
('Rocket', '🚀', 1000, 'To the moon!')
ON CONFLICT (name) DO NOTHING;

-- Verify the gifts were inserted
SELECT * FROM gifts ORDER BY coins_cost;
