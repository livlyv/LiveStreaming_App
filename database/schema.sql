-- Idempotent Supabase Database Schema for Live Streaming App

-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Tables (create if missing)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    bio TEXT,
    profile_pic TEXT,
    profile_picture_url TEXT,
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    stream_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'offline',
    viewer_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_gifts INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(stream_id, user_id)
);

CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS stream_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon_url TEXT,
    coin_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES gifts(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    total_coins INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS direct_message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a UUID REFERENCES users(id) ON DELETE CASCADE,
    user_b UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES direct_message_threads(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3) Ensure columns exist on existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE streams ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'offline';
ALTER TABLE streams ADD COLUMN IF NOT EXISTS viewer_count INTEGER DEFAULT 0;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS total_gifts INTEGER DEFAULT 0;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE streams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_user_id ON stream_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_stream_likes_stream_id ON stream_likes(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_stream_id ON stream_gifts(stream_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_stream_id ON chat_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_user_coins_user_id ON user_coins(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Unique index for gifts.name to support upsert
CREATE UNIQUE INDEX IF NOT EXISTS uniq_gifts_name ON gifts (LOWER(name));

-- 5) Row Level Security (idempotent enabling)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- 6) Policies: create only if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view all profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true)';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id)';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'streams' AND policyname = 'Anyone can view live streams'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can view live streams" ON streams FOR SELECT USING (status = ''live'')';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'streams' AND policyname = 'Users can manage own streams'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can manage own streams" ON streams FOR ALL USING (auth.uid() = user_id)';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stream_viewers' AND policyname = 'Users can view stream viewers'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view stream viewers" ON stream_viewers FOR SELECT USING (true)';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stream_viewers' AND policyname = 'Users can manage own viewing sessions'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can manage own viewing sessions" ON stream_viewers FOR ALL USING (auth.uid() = user_id)';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'direct_message_threads' AND policyname = 'Users can view own threads'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own threads" ON direct_message_threads FOR SELECT USING ( auth.uid() = user_a OR auth.uid() = user_b )';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'direct_message_threads' AND policyname = 'Users can insert threads where they are a participant'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert threads where they are a participant" ON direct_message_threads FOR INSERT WITH CHECK ( auth.uid() = user_a OR auth.uid() = user_b )';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'direct_messages' AND policyname = 'Users can view messages in own threads'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view messages in own threads" ON direct_messages FOR SELECT USING ( auth.uid() = sender_id OR auth.uid() = receiver_id )';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'direct_messages' AND policyname = 'Users can insert messages they send'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert messages they send" ON direct_messages FOR INSERT WITH CHECK ( auth.uid() = sender_id )';
    END IF;
END $$;

-- 7) Timestamp update function and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers to apply any logic changes safely
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_streams_updated_at ON streams;
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8) Follower counts trigger (create or replace function, recreate trigger)
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET following = following + 1 WHERE id = NEW.follower_id;
        UPDATE users SET followers = followers + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET following = following - 1 WHERE id = OLD.follower_id;
        UPDATE users SET followers = followers - 1 WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_follower_counts_trigger ON followers;
CREATE TRIGGER update_follower_counts_trigger
    AFTER INSERT OR DELETE ON followers
    FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- 9) Seed gifts (idempotent)
INSERT INTO gifts (name, icon_url, coin_value)
VALUES
    ('Heart', '❤️', 1),
    ('Star', '⭐', 5),
    ('Diamond', '💎', 10),
    ('Crown', '👑', 25),
    ('Rocket', '🚀', 50),
    ('Fire', '🔥', 100)
ON CONFLICT ((LOWER(name))) DO NOTHING;
