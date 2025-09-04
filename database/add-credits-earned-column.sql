-- SQL Migration: Add credits_earned column to stream_gifts table
-- This migration implements the 70% coins to credits conversion logic

-- 1. Add credits_earned column to stream_gifts table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stream_gifts' AND column_name = 'credits_earned'
    ) THEN
        ALTER TABLE stream_gifts ADD COLUMN credits_earned INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 2. Update existing records to calculate credits_earned (70% of coins_amount)
UPDATE stream_gifts 
SET credits_earned = FLOOR(coins_amount * 0.7)
WHERE credits_earned = 0 AND coins_amount > 0;

-- 3. Create or replace function to calculate user earnings with credits
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
        total_credits * 2, -- Assuming 2x conversion rate for total earnings
        (SELECT COUNT(*) FROM stream_gifts WHERE receiver_id = user_id),
        5000,
        total_credits >= 5000 AND (user_kyc_status = 'verified' OR first_withdrawal_done),
        total_credits >= 5000 AND NOT first_withdrawal_done,
        COALESCE(user_kyc_status, 'pending'),
        COALESCE(first_withdrawal_done, false);
END;
$$ LANGUAGE plpgsql;

-- 4. Update get_top_gifter function to use credits_earned
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

-- 5. Update get_top_gifts function to use credits_earned
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

-- 6. Update can_message_user function to use credits_earned
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

-- 7. Create trigger to automatically calculate credits_earned when inserting new gifts
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_calculate_credits_earned ON stream_gifts;
CREATE TRIGGER trigger_calculate_credits_earned
    BEFORE INSERT OR UPDATE ON stream_gifts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_credits_earned();

-- 8. Create index for better performance on credits_earned queries
CREATE INDEX IF NOT EXISTS idx_stream_gifts_receiver_credits 
ON stream_gifts(receiver_id, credits_earned);

CREATE INDEX IF NOT EXISTS idx_stream_gifts_sender_receiver_credits 
ON stream_gifts(sender_id, receiver_id, credits_earned);

-- 9. Verify the changes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stream_gifts' AND column_name IN ('credits_earned', 'coins_amount')
ORDER BY column_name;

-- 10. Show sample data with conversion
SELECT 
    sg.id,
    sg.sender_id,
    sg.receiver_id,
    sg.coins_amount,
    sg.credits_earned,
    ROUND((sg.credits_earned::DECIMAL / sg.coins_amount * 100), 2) as conversion_percentage
FROM stream_gifts sg
WHERE sg.coins_amount > 0
LIMIT 10;
