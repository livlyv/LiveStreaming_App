-- =============================================================================
-- COMPREHENSIVE DATABASE SCHEMA FOR LIVE STREAMING APP
-- =============================================================================
-- This file consolidates all database schema, migrations, and fixes
-- Run this file in your Supabase SQL Editor to set up the complete database
-- All statements use conditional logic to handle existing objects gracefully
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users Table (with all required columns)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT, -- For email authentication
    bio TEXT DEFAULT 'Hey there! I''m new here',
    profile_pic VARCHAR(500) DEFAULT 'https://ui-avatars.com/api/?name=user&background=E30CBD&color=fff',
    profile_picture_url VARCHAR(500), -- For R2 uploaded images
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_document_url VARCHAR(500),
    kyc_completed_at TIMESTAMP WITH TIME ZONE,
    first_withdrawal_completed BOOLEAN DEFAULT FALSE,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add password column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password TEXT;
    END IF;
    
    -- Add profile_picture_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_picture_url') THEN
        ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500);
    END IF;
    
    -- Add kyc_completed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_completed_at') THEN
        ALTER TABLE users ADD COLUMN kyc_completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add first_withdrawal_completed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_withdrawal_completed') THEN
        ALTER TABLE users ADD COLUMN first_withdrawal_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add kyc_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected'));
    END IF;
    
    -- Add kyc_document_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_document_url') THEN
        ALTER TABLE users ADD COLUMN kyc_document_url VARCHAR(500);
    END IF;
    
    -- Add followers_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'followers_count') THEN
        ALTER TABLE users ADD COLUMN followers_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add following_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'following_count') THEN
        ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add total_likes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_likes') THEN
        ALTER TABLE users ADD COLUMN total_likes INTEGER DEFAULT 0;
    END IF;
    
    -- Add coins_earned column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins_earned') THEN
        ALTER TABLE users ADD COLUMN coins_earned INTEGER DEFAULT 0;
    END IF;
END $$;

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    gift_notifications BOOLEAN DEFAULT TRUE,
    live_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Blocked Users Table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Followers Table
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Streams Table
CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    stream_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'live', 'ended', 'deleted')),
    is_live BOOLEAN DEFAULT FALSE,
    viewer_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    category VARCHAR(100),
    tags TEXT[],
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to streams table if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'status') THEN
        ALTER TABLE streams ADD COLUMN status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'live', 'ended', 'deleted'));
    END IF;
    
    -- Add likes_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'likes_count') THEN
        ALTER TABLE streams ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add coins_earned column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'coins_earned') THEN
        ALTER TABLE streams ADD COLUMN coins_earned INTEGER DEFAULT 0;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'category') THEN
        ALTER TABLE streams ADD COLUMN category VARCHAR(100);
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'tags') THEN
        ALTER TABLE streams ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- Stream Duration Table
CREATE TABLE IF NOT EXISTS stream_duration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stream Likes Table
CREATE TABLE IF NOT EXISTS stream_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

-- Gifts Table
CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    coins_cost INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Handle existing gifts table structure
DO $$ 
BEGIN
    -- Check if gifts table exists and has different column names
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gifts') THEN
        -- If coin_value column exists, rename it to coins_cost
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'coin_value') THEN
            ALTER TABLE gifts RENAME COLUMN coin_value TO coins_cost;
        END IF;
        
        -- If price column exists, rename it to coins_cost
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'price') THEN
            ALTER TABLE gifts RENAME COLUMN price TO coins_cost;
        END IF;
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'icon') THEN
            ALTER TABLE gifts ADD COLUMN icon VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'description') THEN
            ALTER TABLE gifts ADD COLUMN description TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'is_active') THEN
            ALTER TABLE gifts ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
    END IF;
END $$;

-- Add unique constraint to gifts name if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'gifts'::regclass 
        AND conname = 'gifts_name_unique'
    ) THEN
        ALTER TABLE gifts ADD CONSTRAINT gifts_name_unique UNIQUE (name);
    END IF;
END $$;

-- Stream Gifts Table
CREATE TABLE IF NOT EXISTS stream_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES gifts(id) ON DELETE CASCADE,
    coins_amount INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to stream_gifts if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_gifts' AND column_name = 'receiver_id') THEN
        ALTER TABLE stream_gifts ADD COLUMN receiver_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_gifts' AND column_name = 'coins_amount') THEN
        ALTER TABLE stream_gifts ADD COLUMN coins_amount INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_gifts' AND column_name = 'message') THEN
        ALTER TABLE stream_gifts ADD COLUMN message TEXT;
    END IF;
END $$;

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'withdrawal', 'gift_received', 'gift_sent')),
    amount INTEGER NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    reference_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    withdrawal_method VARCHAR(50) NOT NULL,
    account_details JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    cashfree_payout_id VARCHAR(255),
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Support Complaints Table
CREATE TABLE IF NOT EXISTS support_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('follow', 'gift', 'like', 'comment', 'system', 'live_stream')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing read column to notifications if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
        ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Media Files Table
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Blocked users indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- Followers indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Streams indexes
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON streams(is_live);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);

-- Stream duration indexes
CREATE INDEX IF NOT EXISTS idx_stream_duration_user_id ON stream_duration(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_duration_start_time ON stream_duration(start_time);

-- Stream likes indexes
CREATE INDEX IF NOT EXISTS idx_stream_likes_stream_id ON stream_likes(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_likes_user_id ON stream_likes(user_id);

-- Stream gifts indexes
CREATE INDEX IF NOT EXISTS idx_stream_gifts_stream_id ON stream_gifts(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_sender_id ON stream_gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_receiver_id ON stream_gifts(receiver_id);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Withdrawals indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Support complaints indexes
CREATE INDEX IF NOT EXISTS idx_support_complaints_user_id ON support_complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_support_complaints_status ON support_complaints(status);
CREATE INDEX IF NOT EXISTS idx_support_complaints_created_at ON support_complaints(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Media files indexes
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND rowsecurity = true) THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_settings' AND rowsecurity = true) THEN
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'blocked_users' AND rowsecurity = true) THEN
        ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'followers' AND rowsecurity = true) THEN
        ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'streams' AND rowsecurity = true) THEN
        ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stream_duration' AND rowsecurity = true) THEN
        ALTER TABLE stream_duration ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stream_likes' AND rowsecurity = true) THEN
        ALTER TABLE stream_likes ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stream_gifts' AND rowsecurity = true) THEN
        ALTER TABLE stream_gifts ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions' AND rowsecurity = true) THEN
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'withdrawals' AND rowsecurity = true) THEN
        ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'support_complaints' AND rowsecurity = true) THEN
        ALTER TABLE support_complaints ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND rowsecurity = true) THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'media_files' AND rowsecurity = true) THEN
        ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Users policies
    DROP POLICY IF EXISTS "Users can view all users" ON users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON users;
    DROP POLICY IF EXISTS "Users can read own data" ON users;
    DROP POLICY IF EXISTS "Users can read public user data" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;
    
    -- User settings policies
    DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
    
    -- Blocked users policies
    DROP POLICY IF EXISTS "Users can view own blocked users" ON blocked_users;
    DROP POLICY IF EXISTS "Users can block users" ON blocked_users;
    DROP POLICY IF EXISTS "Users can unblock users" ON blocked_users;
    
    -- Followers policies
    DROP POLICY IF EXISTS "Users can view all followers" ON followers;
    DROP POLICY IF EXISTS "Users can create their own follows" ON followers;
    DROP POLICY IF EXISTS "Users can delete their own follows" ON followers;
    
    -- Streams policies
    DROP POLICY IF EXISTS "Users can view all streams" ON streams;
    DROP POLICY IF EXISTS "Users can create their own streams" ON streams;
    DROP POLICY IF EXISTS "Users can update their own streams" ON streams;
    DROP POLICY IF EXISTS "Users can delete their own streams" ON streams;
    DROP POLICY IF EXISTS "Anyone can read streams" ON streams;
    DROP POLICY IF EXISTS "Users can create own streams" ON streams;
    DROP POLICY IF EXISTS "Users can update own streams" ON streams;
    DROP POLICY IF EXISTS "Users can delete own streams" ON streams;
    
    -- Stream duration policies
    DROP POLICY IF EXISTS "Users can view all stream duration" ON stream_duration;
    DROP POLICY IF EXISTS "Users can create their own stream duration" ON stream_duration;
    
    -- Stream likes policies
    DROP POLICY IF EXISTS "Users can view all stream likes" ON stream_likes;
    DROP POLICY IF EXISTS "Users can create their own likes" ON stream_likes;
    DROP POLICY IF EXISTS "Users can delete their own likes" ON stream_likes;
    
    -- Stream gifts policies
    DROP POLICY IF EXISTS "Users can view all stream gifts" ON stream_gifts;
    DROP POLICY IF EXISTS "Users can create their own gifts" ON stream_gifts;
    
    -- Transactions policies
    DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
    
    -- Withdrawals policies
    DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Users can create their own withdrawals" ON withdrawals;
    
    -- Support complaints policies
    DROP POLICY IF EXISTS "Users can view their own complaints" ON support_complaints;
    DROP POLICY IF EXISTS "Users can create their own complaints" ON support_complaints;
    DROP POLICY IF EXISTS "Users can update their own complaints" ON support_complaints;
    
    -- Notifications policies
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    
    -- Media files policies
    DROP POLICY IF EXISTS "Users can read own media files" ON media_files;
    DROP POLICY IF EXISTS "Users can create own media files" ON media_files;
    DROP POLICY IF EXISTS "Users can delete own media files" ON media_files;
END $$;

-- Create policies
-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blocked users policies
CREATE POLICY "Users can view own blocked users" ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block users" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock users" ON blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- Followers policies
CREATE POLICY "Users can view all followers" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can create their own follows" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Streams policies
CREATE POLICY "Users can view all streams" ON streams FOR SELECT USING (true);
CREATE POLICY "Users can create their own streams" ON streams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streams" ON streams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own streams" ON streams FOR DELETE USING (auth.uid() = user_id);

-- Stream duration policies
CREATE POLICY "Users can view all stream duration" ON stream_duration FOR SELECT USING (true);
CREATE POLICY "Users can create their own stream duration" ON stream_duration FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stream likes policies
CREATE POLICY "Users can view all stream likes" ON stream_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own likes" ON stream_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON stream_likes FOR DELETE USING (auth.uid() = user_id);

-- Stream gifts policies
CREATE POLICY "Users can view all stream gifts" ON stream_gifts FOR SELECT USING (true);
CREATE POLICY "Users can create their own gifts" ON stream_gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Withdrawals policies
CREATE POLICY "Users can view their own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Support complaints policies
CREATE POLICY "Users can view their own complaints" ON support_complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own complaints" ON support_complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own complaints" ON support_complaints FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Media files policies
CREATE POLICY "Users can read own media files" ON media_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own media files" ON media_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own media files" ON media_files FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Drop existing functions to avoid conflicts
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS update_follower_counts() CASCADE;
    DROP FUNCTION IF EXISTS update_like_counts() CASCADE;
    DROP FUNCTION IF EXISTS get_stream_duration_by_period(UUID, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS get_top_gifter(UUID) CASCADE;
    DROP FUNCTION IF EXISTS get_top_gifts(UUID, INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS get_gift_earnings(UUID) CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    DROP FUNCTION IF EXISTS can_user_message(UUID, UUID) CASCADE;
END $$;

-- Update follower counts function
CREATE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
        UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update like counts function
CREATE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET total_likes = total_likes + 1 
        WHERE id = (SELECT user_id FROM streams WHERE id = NEW.stream_id);
        UPDATE streams SET likes_count = likes_count + 1 WHERE id = NEW.stream_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET total_likes = total_likes - 1 
        WHERE id = (SELECT user_id FROM streams WHERE id = OLD.stream_id);
        UPDATE streams SET likes_count = likes_count - 1 WHERE id = OLD.stream_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Get stream duration by period function
CREATE FUNCTION get_stream_duration_by_period(
    user_uuid UUID,
    period_type TEXT
)
RETURNS TABLE (
    day_name TEXT,
    total_hours NUMERIC
) AS $$
BEGIN
    IF period_type = 'weekly' THEN
        RETURN QUERY
        SELECT 
            CASE EXTRACT(DOW FROM sd.start_time)
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END::TEXT as day_name,
            COALESCE(SUM(sd.duration_minutes) / 60.0, 0)::NUMERIC as total_hours
        FROM stream_duration sd
        WHERE sd.user_id = user_uuid
        AND sd.start_time >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY EXTRACT(DOW FROM sd.start_time)
        ORDER BY EXTRACT(DOW FROM sd.start_time);
    ELSIF period_type = 'monthly' THEN
        RETURN QUERY
        SELECT 
            'Week ' || EXTRACT(WEEK FROM sd.start_time)::TEXT as day_name,
            COALESCE(SUM(sd.duration_minutes) / 60.0, 0)::NUMERIC as total_hours
        FROM stream_duration sd
        WHERE sd.user_id = user_uuid
        AND sd.start_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(WEEK FROM sd.start_time)
        ORDER BY EXTRACT(WEEK FROM sd.start_time);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Get top gifter function
CREATE FUNCTION get_top_gifter(user_uuid UUID)
RETURNS TABLE (
    sender_id UUID,
    sender_username TEXT,
    total_coins_sent INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sg.sender_id,
        u.username::TEXT,
        SUM(sg.coins_amount)::INTEGER as total_coins_sent
    FROM stream_gifts sg
    JOIN users u ON sg.sender_id = u.id
    WHERE sg.receiver_id = user_uuid
    GROUP BY sg.sender_id, u.username
    ORDER BY total_coins_sent DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get top gifts function
CREATE FUNCTION get_top_gifts(user_uuid UUID, gift_limit INTEGER DEFAULT 4)
RETURNS TABLE (
    gift_id UUID,
    gift_name TEXT,
    gift_icon TEXT,
    total_coins INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name::TEXT,
        g.icon::TEXT,
        SUM(sg.coins_amount)::INTEGER as total_coins
    FROM stream_gifts sg
    JOIN gifts g ON sg.gift_id = g.id
    WHERE sg.receiver_id = user_uuid
    GROUP BY g.id, g.name, g.icon
    ORDER BY total_coins DESC
    LIMIT gift_limit;
END;
$$ LANGUAGE plpgsql;

-- Get gift earnings function
CREATE FUNCTION get_gift_earnings(user_uuid UUID)
RETURNS TABLE (
    total_coins INTEGER,
    total_gifts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(sg.coins_amount), 0)::INTEGER as total_coins,
        COUNT(*)::INTEGER as total_gifts
    FROM stream_gifts sg
    WHERE sg.receiver_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Check if user can message another user (99 coins threshold)
CREATE FUNCTION can_user_message(sender_uuid UUID, receiver_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_coins_sent INTEGER;
BEGIN
    SELECT COALESCE(SUM(coins_amount), 0) INTO total_coins_sent
    FROM stream_gifts
    WHERE sender_id = sender_uuid AND receiver_id = receiver_uuid;
    
    RETURN total_coins_sent >= 99;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Drop existing triggers to avoid conflicts
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_follower_counts_trigger ON followers;
    DROP TRIGGER IF EXISTS update_like_counts_trigger ON stream_likes;
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    DROP TRIGGER IF EXISTS update_streams_updated_at ON streams;
    DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
    DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
    DROP TRIGGER IF EXISTS update_support_complaints_updated_at ON support_complaints;
    DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
END $$;

-- Create triggers
CREATE TRIGGER update_follower_counts_trigger
    AFTER INSERT OR DELETE ON followers
    FOR EACH ROW
    EXECUTE FUNCTION update_follower_counts();

CREATE TRIGGER update_like_counts_trigger
    AFTER INSERT OR DELETE ON stream_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_like_counts();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_complaints_updated_at BEFORE UPDATE ON support_complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SAMPLE DATA
-- =============================================================================

-- Insert sample gifts (handle existing column names)
DO $$ 
BEGIN
    -- Check if gifts table has the expected columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'coins_cost') THEN
        -- Insert with coins_cost column
        INSERT INTO gifts (name, icon, coins_cost, description) VALUES
        ('Rose', '🌹', 10, 'A beautiful rose'),
        ('Heart', '❤️', 50, 'Show your love'),
        ('Crown', '👑', 100, 'Royal gift'),
        ('Diamond', '💎', 500, 'Precious diamond'),
        ('Rocket', '🚀', 1000, 'To the moon!')
        ON CONFLICT (name) DO NOTHING;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'coin_value') THEN
        -- Insert with coin_value column (old column name)
        INSERT INTO gifts (name, icon, coin_value, description) VALUES
        ('Rose', '🌹', 10, 'A beautiful rose'),
        ('Heart', '❤️', 50, 'Show your love'),
        ('Crown', '👑', 100, 'Royal gift'),
        ('Diamond', '💎', 500, 'Precious diamond'),
        ('Rocket', '🚀', 1000, 'To the moon!')
        ON CONFLICT (name) DO NOTHING;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'price') THEN
        -- Insert with price column (old column name)
        INSERT INTO gifts (name, icon, price, description) VALUES
        ('Rose', '🌹', 10, 'A beautiful rose'),
        ('Heart', '❤️', 50, 'Show your love'),
        ('Crown', '👑', 100, 'Royal gift'),
        ('Diamond', '💎', 500, 'Precious diamond'),
        ('Rocket', '🚀', 1000, 'To the moon!')
        ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;

-- Update existing users to have default values
UPDATE users 
SET 
  first_withdrawal_completed = COALESCE(first_withdrawal_completed, FALSE),
  kyc_status = COALESCE(kyc_status, 'pending'),
  followers_count = COALESCE(followers_count, 0),
  following_count = COALESCE(following_count, 0),
  total_likes = COALESCE(total_likes, 0),
  coins_earned = COALESCE(coins_earned, 0)
WHERE first_withdrawal_completed IS NULL 
   OR kyc_status IS NULL 
   OR followers_count IS NULL 
   OR following_count IS NULL 
   OR total_likes IS NULL 
   OR coins_earned IS NULL;

-- Update existing notifications to have read = false
UPDATE notifications 
SET read = FALSE 
WHERE read IS NULL;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Verify all tables exist and have required columns
SELECT 'Database Schema Verification' as status;

SELECT 'Users table columns' as check_type, 
       COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('kyc_completed_at', 'first_withdrawal_completed', 'kyc_status', 'kyc_document_url', 'followers_count', 'following_count', 'total_likes', 'coins_earned');

SELECT 'user_settings table' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN 1 ELSE 0 END as exists

UNION ALL

SELECT 'user_settings table' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN 1 ELSE 0 END as exists

UNION ALL

SELECT 'blocked_users table' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocked_users') THEN 1 ELSE 0 END as exists

UNION ALL

SELECT 'withdrawals table' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawals') THEN 1 ELSE 0 END as exists

UNION ALL

SELECT 'stream_likes table' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stream_likes') THEN 1 ELSE 0 END as exists

UNION ALL

SELECT 'notifications table' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN 1 ELSE 0 END as exists

UNION ALL

SELECT 'support_complaints table' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_complaints') THEN 1 ELSE 0 END as exists

UNION ALL

SELECT 'media_files table' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_files') THEN 1 ELSE 0 END as exists;

-- =============================================================================
-- COMPREHENSIVE DATABASE SCHEMA COMPLETE
-- =============================================================================
-- This schema includes:
-- ✅ All core tables with proper relationships
-- ✅ All required columns with conditional creation
-- ✅ Comprehensive indexes for performance
-- ✅ Row Level Security enabled on all tables
-- ✅ RLS policies for proper access control
-- ✅ Database functions for business logic
-- ✅ Triggers for automatic updates
-- ✅ Sample data insertion
-- ✅ Verification queries
-- =============================================================================
