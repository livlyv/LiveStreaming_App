-- Complete Database Fix Script
-- Run this in your Supabase SQL Editor to fix all missing tables and columns

-- 1. Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_withdrawal_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_document_url VARCHAR(500);

-- 2. Create user_settings table if it doesn't exist
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

-- 3. Create blocked_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- 4. Create withdrawals table if it doesn't exist
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

-- 5. Create stream_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS stream_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

-- 6. Create notifications table if it doesn't exist
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

-- 7. Create indexes
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

-- 8. Enable RLS on new tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (removing IF NOT EXISTS as it's not supported for policies)
-- User settings policies
DO $$ 
BEGIN
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

-- 10. Create or replace functions
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

-- 11. Create trigger for like counts
DROP TRIGGER IF EXISTS update_like_counts_trigger ON stream_likes;
CREATE TRIGGER update_like_counts_trigger
    AFTER INSERT OR DELETE ON stream_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_like_counts();

-- 12. Create or replace update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Update existing users to have default values
UPDATE users 
SET 
  first_withdrawal_completed = COALESCE(first_withdrawal_completed, FALSE),
  kyc_status = COALESCE(kyc_status, 'pending')
WHERE first_withdrawal_completed IS NULL OR kyc_status IS NULL;

-- 15. Verify the fix
SELECT 'Users table columns' as check_type, 
       COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('kyc_completed_at', 'first_withdrawal_completed', 'kyc_status', 'kyc_document_url')

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
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN 1 ELSE 0 END as exists;
