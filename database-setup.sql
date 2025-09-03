-- Live Streaming App Database Setup
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    password TEXT, -- For email authentication
    bio TEXT DEFAULT 'Hey there! I''m new here',
    profile_pic TEXT DEFAULT 'https://ui-avatars.com/api/?name=user&background=E30CBD&color=fff',
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    stream_key TEXT UNIQUE NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    viewer_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gifts table
CREATE TABLE IF NOT EXISTS gifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    icon_url TEXT NOT NULL,
    price INTEGER NOT NULL,
    animation_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('purchase', 'gift', 'withdrawal', 'earning')),
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'coins',
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('follow', 'gift', 'like', 'comment', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Followers table (for many-to-many relationship)
CREATE TABLE IF NOT EXISTS followers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON streams(is_live);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic ones - customize as needed)
-- Users can read their own data and public user data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can read public user data" ON users FOR SELECT USING (true);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Streams policies
CREATE POLICY "Anyone can read streams" ON streams FOR SELECT USING (true);
CREATE POLICY "Users can create own streams" ON streams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streams" ON streams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own streams" ON streams FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Media files policies
CREATE POLICY "Users can read own media files" ON media_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own media files" ON media_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own media files" ON media_files FOR DELETE USING (auth.uid() = user_id);

-- Followers policies
CREATE POLICY "Anyone can read followers" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can create follow relationships" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follow relationships" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Insert some sample gifts
INSERT INTO gifts (name, icon_url, price, animation_url) VALUES
('Rose', 'https://example.com/rose.png', 10, 'https://example.com/rose.gif'),
('Heart', 'https://example.com/heart.png', 20, 'https://example.com/heart.gif'),
('Diamond', 'https://example.com/diamond.png', 100, 'https://example.com/diamond.gif'),
('Crown', 'https://example.com/crown.png', 500, 'https://example.com/crown.gif'),
('Rocket', 'https://example.com/rocket.png', 1000, 'https://example.com/rocket.gif')
ON CONFLICT DO NOTHING;


