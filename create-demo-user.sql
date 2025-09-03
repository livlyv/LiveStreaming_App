-- Create demo user directly in Supabase SQL editor
-- This bypasses RLS policies

-- First, delete any existing demo user
DELETE FROM users WHERE email = 'demo@gmail.com';

-- Create the demo user with hashed password
-- The password 'Demo@123' hashed with bcrypt (salt rounds: 12)
INSERT INTO users (
    email,
    username,
    password,
    bio,
    profile_pic,
    followers,
    following,
    total_likes,
    coins_earned,
    is_verified
) VALUES (
    'demo@gmail.com',
    'demo_user',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iKGi', -- Demo@123 hashed
    'Demo user for testing',
    'https://ui-avatars.com/api/?name=demo&background=E30CBD&color=fff',
    0,
    0,
    0,
    0,
    false
);

-- Verify the user was created
SELECT id, email, username, bio, created_at FROM users WHERE email = 'demo@gmail.com';


