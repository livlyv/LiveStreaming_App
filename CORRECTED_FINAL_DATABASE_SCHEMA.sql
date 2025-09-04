-- CORRECTED FINAL DATABASE SCHEMA FOR LIVE STREAMING APP
-- This schema properly handles coins_earned to credits_earned migration
-- Copy and paste this entire file into your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- MIGRATION: COINS_EARNED TO CREDITS_EARNED
-- =====================================================

-- 1. Handle coins_earned to credits_earned migration in users table
DO $$ 
BEGIN
    -- Check if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins_earned') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'credits_earned') THEN
        -- Both columns exist, drop the credits_earned column first, then rename coins_earned
        ALTER TABLE users DROP COLUMN credits_earned;
        ALTER TABLE users RENAME COLUMN coins_earned TO credits_earned;
        RAISE NOTICE 'Removed duplicate credits_earned column and renamed coins_earned to credits_earned in users table';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins_earned') THEN
        -- Only coins_earned exists, rename it
        ALTER TABLE users RENAME COLUMN coins_earned TO credits_earned;
        RAISE NOTICE 'Renamed coins_earned to credits_earned in users table';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'credits_earned') THEN
        -- Neither column exists, add credits_earned
        ALTER TABLE users ADD COLUMN credits_earned INTEGER DEFAULT 0;
        RAISE NOTICE 'Added credits_earned column to users table';
    ELSE
        -- Only credits_earned exists, no action needed
        RAISE NOTICE 'credits_earned column already exists in users table';
    END IF;
END $$;

-- 2. Handle coins_earned to credits_earned migration in streams table
DO $$ 
BEGIN
    -- Check if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'coins_earned') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'credits_earned') THEN
        -- Both columns exist, drop the credits_earned column first, then rename coins_earned
        ALTER TABLE streams DROP COLUMN credits_earned;
        ALTER TABLE streams RENAME COLUMN coins_earned TO credits_earned;
        RAISE NOTICE 'Removed duplicate credits_earned column and renamed coins_earned to credits_earned in streams table';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'coins_earned') THEN
        -- Only coins_earned exists, rename it
        ALTER TABLE streams RENAME COLUMN coins_earned TO credits_earned;
        RAISE NOTICE 'Renamed coins_earned to credits_earned in streams table';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'credits_earned') THEN
        -- Neither column exists, add credits_earned
        ALTER TABLE streams ADD COLUMN credits_earned INTEGER DEFAULT 0;
        RAISE NOTICE 'Added credits_earned column to streams table';
    ELSE
        -- Only credits_earned exists, no action needed
        RAISE NOTICE 'credits_earned column already exists in streams table';
    END IF;
END $$;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    profile_pic TEXT,
    bio TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_document_url TEXT,
    kyc_completed_at TIMESTAMP WITH TIME ZONE,
    first_withdrawal_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streams Table
CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    stream_key VARCHAR(255) UNIQUE NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    viewer_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stream Duration Table
CREATE TABLE IF NOT EXISTS stream_duration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Stream Gifts Table
CREATE TABLE IF NOT EXISTS stream_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES gifts(id) ON DELETE CASCADE,
    coins_amount INTEGER NOT NULL DEFAULT 0,
    credits_earned INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'withdrawal', 'gift_received', 'gift_sent')),
    amount INTEGER NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    reference_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    withdrawal_method VARCHAR(50) NOT NULL,
    account_details JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    cashfree_payout_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Followers Table
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Complaints Table
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

-- =====================================================
-- HANDLE EXISTING COLUMNS AND RENAMES
-- =====================================================

-- Handle existing gifts table structure
DO $$ 
BEGIN
    -- If coin_value column exists, rename it to coins_cost
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'coin_value') THEN
        ALTER TABLE gifts RENAME COLUMN coin_value TO coins_cost;
        RAISE NOTICE 'Renamed coin_value to coins_cost in gifts table';
    END IF;
    
    -- If price column exists, rename it to coins_cost
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'price') THEN
        ALTER TABLE gifts RENAME COLUMN price TO coins_cost;
        RAISE NOTICE 'Renamed price to coins_cost in gifts table';
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
END $$;

-- Handle existing stream_gifts table structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_gifts' AND column_name = 'receiver_id') THEN
        ALTER TABLE stream_gifts ADD COLUMN receiver_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_gifts' AND column_name = 'coins_amount') THEN
        ALTER TABLE stream_gifts ADD COLUMN coins_amount INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_gifts' AND column_name = 'credits_earned') THEN
        ALTER TABLE stream_gifts ADD COLUMN credits_earned INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_gifts' AND column_name = 'message') THEN
        ALTER TABLE stream_gifts ADD COLUMN message TEXT;
    END IF;
END $$;

-- Handle existing users table structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'followers_count') THEN
        ALTER TABLE users ADD COLUMN followers_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'following_count') THEN
        ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_likes') THEN
        ALTER TABLE users ADD COLUMN total_likes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_document_url') THEN
        ALTER TABLE users ADD COLUMN kyc_document_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_completed_at') THEN
        ALTER TABLE users ADD COLUMN kyc_completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_withdrawal_completed') THEN
        ALTER TABLE users ADD COLUMN first_withdrawal_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- =====================================================
-- CONSTRAINTS AND INDEXES
-- =====================================================

-- Add unique constraints if they don't exist
DO $$ 
BEGIN
    -- Gifts name unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'gifts'::regclass 
        AND conname = 'gifts_name_unique'
    ) THEN
        ALTER TABLE gifts ADD CONSTRAINT gifts_name_unique UNIQUE (name);
    END IF;
    
    -- Followers unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'followers'::regclass 
        AND conname = 'followers_unique'
    ) THEN
        ALTER TABLE followers ADD CONSTRAINT followers_unique UNIQUE (follower_id, following_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON streams(is_live);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_receiver_id ON stream_gifts(receiver_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_sender_id ON stream_gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_stream_id ON stream_gifts(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_receiver_credits ON stream_gifts(receiver_id, credits_earned);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_sender_receiver_credits ON stream_gifts(sender_id, receiver_id, credits_earned);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_support_complaints_user_id ON support_complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_support_complaints_status ON support_complaints(status);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to calculate user earnings with credits
CREATE OR REPLACE FUNCTION get_user_earnings_with_credits(user_id UUID)
RETURNS TABLE (
    credits_earned INTEGER,
    total_earnings INTEGER,
    total_gifts INTEGER,
    withdrawal_threshold INTEGER,
    can_withdraw BOOLEAN,
    kyc_required BOOLEAN,
    kyc_status TEXT,
    first_withdrawal_completed BOOLEAN
) AS $$
DECLARE
    total_credits INTEGER;
    user_kyc_status TEXT;
    first_withdrawal_done BOOLEAN;
BEGIN
    -- Get total credits from stream_gifts using credits_earned column
    SELECT COALESCE(SUM(sg.credits_earned), 0) INTO total_credits
    FROM stream_gifts sg
    WHERE sg.receiver_id = user_id;
    
    -- Get user KYC status
    SELECT kyc_status, first_withdrawal_completed 
    INTO user_kyc_status, first_withdrawal_done
    FROM users 
    WHERE id = user_id;
    
    -- Update user's credits_earned column
    UPDATE users 
    SET credits_earned = total_credits
    WHERE id = user_id;
    
    RETURN QUERY SELECT 
        total_credits,
        FLOOR(total_credits * 0.55), -- 55% of credits earned in rupees
        (SELECT COUNT(*) FROM stream_gifts WHERE receiver_id = user_id),
        5000,
        total_credits >= 5000 AND (user_kyc_status = 'verified' OR first_withdrawal_done),
        total_credits >= 5000 AND NOT first_withdrawal_done,
        COALESCE(user_kyc_status, 'pending'),
        COALESCE(first_withdrawal_done, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get top gifter with credits
CREATE OR REPLACE FUNCTION get_top_gifter_with_credits(receiver_id UUID)
RETURNS TABLE (
    sender_id UUID,
    sender_username TEXT,
    sender_profile_pic TEXT,
    total_credits_sent INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as sender_id,
        u.username as sender_username,
        u.profile_pic as sender_profile_pic,
        SUM(sg.credits_earned)::INTEGER as total_credits_sent
    FROM stream_gifts sg
    JOIN users u ON sg.sender_id = u.id
    WHERE sg.receiver_id = $1
    GROUP BY u.id, u.username, u.profile_pic
    ORDER BY total_credits_sent DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get top gifts with credits
CREATE OR REPLACE FUNCTION get_top_gifts_with_credits(receiver_id UUID, limit_count INTEGER DEFAULT 4)
RETURNS TABLE (
    gift_id UUID,
    gift_name TEXT,
    gift_icon TEXT,
    gift_value INTEGER,
    total_quantity INTEGER,
    total_credits INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as gift_id,
        g.name as gift_name,
        g.icon as gift_icon,
        g.coins_cost as gift_value,
        COUNT(*)::INTEGER as total_quantity,
        SUM(sg.credits_earned)::INTEGER as total_credits
    FROM stream_gifts sg
    JOIN gifts g ON sg.gift_id = g.id
    WHERE sg.receiver_id = $1
    GROUP BY g.id, g.name, g.icon, g.coins_cost
    ORDER BY total_credits DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can message another user based on credits
CREATE OR REPLACE FUNCTION can_message_user_with_credits(sender_id UUID, receiver_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_credits_sent INTEGER;
BEGIN
    SELECT COALESCE(SUM(credits_earned), 0) INTO total_credits_sent
    FROM stream_gifts
    WHERE sender_id = $1 AND receiver_id = $2;
    
    RETURN total_credits_sent >= 99;
END;
$$ LANGUAGE plpgsql;

-- Function to get stream duration statistics
CREATE OR REPLACE FUNCTION get_stream_duration_stats(user_id UUID, period_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_duration INTEGER,
    average_duration INTEGER,
    total_streams INTEGER,
    period_start DATE,
    period_end DATE
) AS $$
DECLARE
    period_start_date DATE;
    period_end_date DATE;
BEGIN
    period_end_date := CURRENT_DATE;
    period_start_date := period_end_date - period_days;
    
    RETURN QUERY
    SELECT 
        COALESCE(SUM(sd.duration_minutes), 0)::INTEGER as total_duration,
        COALESCE(AVG(sd.duration_minutes), 0)::INTEGER as average_duration,
        COUNT(sd.id)::INTEGER as total_streams,
        period_start_date,
        period_end_date
    FROM stream_duration sd
    WHERE sd.user_id = $1 
    AND sd.date >= period_start_date 
    AND sd.date <= period_end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment following count for follower
        UPDATE users 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        -- Increment followers count for following
        UPDATE users 
        SET followers_count = followers_count + 1 
        WHERE id = NEW.following_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement following count for follower
        UPDATE users 
        SET following_count = following_count - 1 
        WHERE id = OLD.follower_id;
        
        -- Decrement followers count for following
        UPDATE users 
        SET followers_count = followers_count - 1 
        WHERE id = OLD.following_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically calculate credits_earned when inserting new gifts
CREATE OR REPLACE FUNCTION calculate_credits_earned()
RETURNS TRIGGER AS $$
BEGIN
    -- If credits_earned is not set, calculate it as 70% of coins_amount
    IF NEW.credits_earned IS NULL OR NEW.credits_earned = 0 THEN
        NEW.credits_earned := FLOOR(NEW.coins_amount * 0.7);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS trigger_calculate_credits_earned ON stream_gifts;
CREATE TRIGGER trigger_calculate_credits_earned
    BEFORE INSERT OR UPDATE ON stream_gifts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_credits_earned();

-- Drop and recreate follower count trigger
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON followers;
CREATE TRIGGER trigger_update_follower_counts
    AFTER INSERT OR DELETE ON followers
    FOR EACH ROW
    EXECUTE FUNCTION update_follower_counts();

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample gifts if they don't exist
INSERT INTO gifts (name, icon, coins_cost, description, is_active) VALUES
    ('Rose', '🌹', 10, 'A beautiful rose', true),
    ('Heart', '❤️', 50, 'Show your love', true),
    ('Crown', '👑', 100, 'Royal gift', true),
    ('Diamond', '💎', 500, 'Precious diamond', true),
    ('Rocket', '🚀', 1000, 'To the moon!', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- UPDATE EXISTING RECORDS
-- =====================================================

-- Update existing stream_gifts records to calculate credits_earned (70% of coins_amount)
UPDATE stream_gifts 
SET credits_earned = FLOOR(coins_amount * 0.7)
WHERE credits_earned = 0 AND coins_amount > 0;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_complaints ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view other profiles" ON users;
CREATE POLICY "Users can view other profiles" ON users
    FOR SELECT USING (true);

-- Streams policies
DROP POLICY IF EXISTS "Users can view all streams" ON streams;
CREATE POLICY "Users can view all streams" ON streams
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own streams" ON streams;
CREATE POLICY "Users can manage their own streams" ON streams
    FOR ALL USING (auth.uid() = user_id);

-- Stream gifts policies
DROP POLICY IF EXISTS "Users can view stream gifts" ON stream_gifts;
CREATE POLICY "Users can view stream gifts" ON stream_gifts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send gifts" ON stream_gifts;
CREATE POLICY "Users can send gifts" ON stream_gifts
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
CREATE POLICY "Users can create their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Withdrawals policies
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
CREATE POLICY "Users can view their own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own withdrawals" ON withdrawals;
CREATE POLICY "Users can create their own withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Followers policies
DROP POLICY IF EXISTS "Users can view followers" ON followers;
CREATE POLICY "Users can view followers" ON followers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own follows" ON followers;
CREATE POLICY "Users can manage their own follows" ON followers
    FOR ALL USING (auth.uid() = follower_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Support complaints policies
DROP POLICY IF EXISTS "Users can view their own complaints" ON support_complaints;
CREATE POLICY "Users can view their own complaints" ON support_complaints
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own complaints" ON support_complaints;
CREATE POLICY "Users can create their own complaints" ON support_complaints
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'streams', 'stream_duration', 'gifts', 'stream_gifts', 
    'transactions', 'withdrawals', 'followers', 'notifications', 'support_complaints'
)
ORDER BY table_name;

-- Verify credits_earned column exists in stream_gifts
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stream_gifts' AND column_name = 'credits_earned';

-- Verify credits_earned column exists in users table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'credits_earned';

-- Show sample data with conversion
SELECT 
    sg.id,
    sg.sender_id,
    sg.receiver_id,
    sg.coins_amount,
    sg.credits_earned,
    ROUND((sg.credits_earned::DECIMAL / sg.coins_amount * 100), 2) as conversion_percentage
FROM stream_gifts sg
WHERE sg.coins_amount > 0
LIMIT 5;

-- Verify functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_user_earnings_with_credits',
    'get_top_gifter_with_credits', 
    'get_top_gifts_with_credits',
    'can_message_user_with_credits',
    'get_stream_duration_stats',
    'update_follower_counts',
    'calculate_credits_earned'
)
ORDER BY routine_name;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This will show a completion message
SELECT 'Database schema successfully created with ALL migrations including coins_earned to credits_earned conversion!' as status;
