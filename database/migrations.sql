-- Migration script to add missing columns and ensure all tables exist
-- Run this script to update your existing database

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
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
END $$;

-- Create user_settings table if it doesn't exist
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

-- Create blocked_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Create withdrawals table if it doesn't exist
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

-- Create stream_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS stream_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

-- Create notifications table if it doesn't exist
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_stream_likes_stream_id ON stream_likes(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_likes_user_id ON stream_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS on new tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
DO $$ 
BEGIN
    -- User settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view own settings') THEN
        CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings') THEN
        CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert own settings') THEN
        CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Blocked users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_users' AND policyname = 'Users can view own blocked users') THEN
        CREATE POLICY "Users can view own blocked users" ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_users' AND policyname = 'Users can block users') THEN
        CREATE POLICY "Users can block users" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_users' AND policyname = 'Users can unblock users') THEN
        CREATE POLICY "Users can unblock users" ON blocked_users FOR DELETE USING (auth.uid() = blocker_id);
    END IF;
    
    -- Withdrawals policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'Users can view their own withdrawals') THEN
        CREATE POLICY "Users can view their own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'Users can create their own withdrawals') THEN
        CREATE POLICY "Users can create their own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Stream likes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stream_likes' AND policyname = 'Users can view all stream likes') THEN
        CREATE POLICY "Users can view all stream likes" ON stream_likes FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stream_likes' AND policyname = 'Users can create their own likes') THEN
        CREATE POLICY "Users can create their own likes" ON stream_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stream_likes' AND policyname = 'Users can delete their own likes') THEN
        CREATE POLICY "Users can delete their own likes" ON stream_likes FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    -- Notifications policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create or replace functions
CREATE OR REPLACE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET total_likes = total_likes + 1 
        WHERE id = (SELECT user_id FROM streams WHERE id = NEW.stream_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET total_likes = total_likes - 1 
        WHERE id = (SELECT user_id FROM streams WHERE id = OLD.stream_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like counts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_like_counts_trigger') THEN
        CREATE TRIGGER update_like_counts_trigger
            AFTER INSERT OR DELETE ON stream_likes
            FOR EACH ROW
            EXECUTE FUNCTION update_like_counts();
    END IF;
END $$;

-- Create or replace update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_withdrawals_updated_at') THEN
        CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at') THEN
        CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample gifts if they don't exist
INSERT INTO gifts (name, icon, coins_cost, description) VALUES
('Rose', '🌹', 10, 'A beautiful rose'),
('Heart', '❤️', 50, 'Show your love'),
('Crown', '👑', 100, 'Royal gift'),
('Diamond', '💎', 500, 'Precious diamond'),
('Rocket', '🚀', 1000, 'To the moon!')
ON CONFLICT DO NOTHING;
