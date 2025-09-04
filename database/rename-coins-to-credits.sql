-- SQL Script to rename coins_earned to credits_earned
-- Run this script to update your database schema

-- 1. Rename column in users table
ALTER TABLE users RENAME COLUMN coins_earned TO credits_earned;

-- 2. Rename column in streams table  
ALTER TABLE streams RENAME COLUMN coins_earned TO credits_earned;

-- 3. Update database functions to use credits_earned
CREATE OR REPLACE FUNCTION get_user_earnings(user_id UUID)
RETURNS TABLE (
    credits_earned INTEGER,
    total_earnings INTEGER,
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
    -- Get total credits from stream_gifts
    SELECT COALESCE(SUM(sg.coins_amount), 0) INTO total_credits
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
        total_credits * 2, -- Assuming 2x conversion rate
        5000,
        total_credits >= 5000 AND (user_kyc_status = 'verified' OR first_withdrawal_done),
        total_credits >= 5000 AND NOT first_withdrawal_done,
        COALESCE(user_kyc_status, 'pending'),
        COALESCE(first_withdrawal_done, false);
END;
$$ LANGUAGE plpgsql;

-- 4. Update get_top_gifter function
CREATE OR REPLACE FUNCTION get_top_gifter(receiver_id UUID)
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
        SUM(sg.coins_amount)::INTEGER as total_credits_sent
    FROM stream_gifts sg
    JOIN users u ON sg.sender_id = u.id
    WHERE sg.receiver_id = $1
    GROUP BY u.id, u.username, u.profile_pic
    ORDER BY total_credits_sent DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 5. Update get_top_gifts function
CREATE OR REPLACE FUNCTION get_top_gifts(receiver_id UUID, limit_count INTEGER DEFAULT 4)
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
        SUM(sg.coins_amount)::INTEGER as total_credits
    FROM stream_gifts sg
    JOIN gifts g ON sg.gift_id = g.id
    WHERE sg.receiver_id = $1
    GROUP BY g.id, g.name, g.icon, g.coins_cost
    ORDER BY total_credits DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Update can_message_user function
CREATE OR REPLACE FUNCTION can_message_user(sender_id UUID, receiver_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_credits_sent INTEGER;
BEGIN
    SELECT COALESCE(SUM(coins_amount), 0) INTO total_credits_sent
    FROM stream_gifts
    WHERE sender_id = $1 AND receiver_id = $2;
    
    RETURN total_credits_sent >= 99;
END;
$$ LANGUAGE plpgsql;

-- 7. Update any views that reference coins_earned
-- (Add your specific views here)

-- 8. Update any triggers that reference coins_earned
-- (Add your specific triggers here)

-- 9. Update RLS policies if they reference coins_earned
-- (Add your specific policies here)

-- 10. Verify the changes
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'credits_earned'
ORDER BY table_name;

-- 11. Check for any remaining references to coins_earned
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_definition ILIKE '%coins_earned%'
ORDER BY routine_name;
