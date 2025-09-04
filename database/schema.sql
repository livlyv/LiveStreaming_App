-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    bio TEXT,
    profile_pic VARCHAR(500),
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
    is_live BOOLEAN DEFAULT FALSE,
    viewer_count INTEGER DEFAULT 0,
    category VARCHAR(100),
    tags TEXT[],
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Stream Gifts Table
CREATE TABLE IF NOT EXISTS stream_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES gifts(id) ON DELETE CASCADE,
    coins_amount INTEGER NOT NULL,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON streams(is_live);
CREATE INDEX IF NOT EXISTS idx_stream_duration_user_id ON stream_duration(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_duration_start_time ON stream_duration(start_time);
CREATE INDEX IF NOT EXISTS idx_stream_likes_stream_id ON stream_likes(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_likes_user_id ON stream_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_stream_id ON stream_gifts(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_sender_id ON stream_gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_receiver_id ON stream_gifts(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_support_complaints_user_id ON support_complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_support_complaints_status ON support_complaints(status);
CREATE INDEX IF NOT EXISTS idx_support_complaints_created_at ON support_complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_duration ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blocked users policies
CREATE POLICY "Users can view own blocked users" ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block users" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock users" ON blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- Users can view all followers
CREATE POLICY "Users can view all followers" ON followers FOR SELECT USING (true);

-- Users can create their own follows
CREATE POLICY "Users can create their own follows" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follows
CREATE POLICY "Users can delete their own follows" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Users can view all streams
CREATE POLICY "Users can view all streams" ON streams FOR SELECT USING (true);

-- Users can create their own streams
CREATE POLICY "Users can create their own streams" ON streams FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own streams
CREATE POLICY "Users can update their own streams" ON streams FOR UPDATE USING (auth.uid() = user_id);

-- Users can view all stream duration
CREATE POLICY "Users can view all stream duration" ON stream_duration FOR SELECT USING (true);

-- Users can create their own stream duration
CREATE POLICY "Users can create their own stream duration" ON stream_duration FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view all stream likes
CREATE POLICY "Users can view all stream likes" ON stream_likes FOR SELECT USING (true);

-- Users can create their own likes
CREATE POLICY "Users can create their own likes" ON stream_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON stream_likes FOR DELETE USING (auth.uid() = user_id);

-- Users can view all stream gifts
CREATE POLICY "Users can view all stream gifts" ON stream_gifts FOR SELECT USING (true);

-- Users can create their own gifts
CREATE POLICY "Users can create their own gifts" ON stream_gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own transactions
CREATE POLICY "Users can create their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own withdrawals
CREATE POLICY "Users can view their own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own withdrawals
CREATE POLICY "Users can create their own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own complaints
CREATE POLICY "Users can view their own complaints" ON support_complaints FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own complaints
CREATE POLICY "Users can create their own complaints" ON support_complaints FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own complaints
CREATE POLICY "Users can update their own complaints" ON support_complaints FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Functions
-- Update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
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

-- Trigger for follower counts
CREATE TRIGGER update_follower_counts_trigger
    AFTER INSERT OR DELETE ON followers
    FOR EACH ROW
    EXECUTE FUNCTION update_follower_counts();

-- Update like counts
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

-- Trigger for like counts
CREATE TRIGGER update_like_counts_trigger
    AFTER INSERT OR DELETE ON stream_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_like_counts();

-- Get stream duration by period
CREATE OR REPLACE FUNCTION get_stream_duration_by_period(
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

-- Get top gifter
CREATE OR REPLACE FUNCTION get_top_gifter(user_uuid UUID)
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

-- Get top gifts
CREATE OR REPLACE FUNCTION get_top_gifts(user_uuid UUID, gift_limit INTEGER DEFAULT 4)
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

-- Get gift earnings
CREATE OR REPLACE FUNCTION get_gift_earnings(user_uuid UUID)
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

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_complaints_updated_at BEFORE UPDATE ON support_complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO gifts (name, icon, coins_cost, description) VALUES
('Rose', '🌹', 10, 'A beautiful rose'),
('Heart', '❤️', 50, 'Show your love'),
('Crown', '👑', 100, 'Royal gift'),
('Diamond', '💎', 500, 'Precious diamond'),
('Rocket', '🚀', 1000, 'To the moon!')
ON CONFLICT DO NOTHING;
