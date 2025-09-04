# Coins to Credits Conversion System

## Overview

This document explains the implementation of the coins to credits conversion system where:
- **Coins** can only be purchased by users
- When coins are sent as gifts, they are automatically converted to **credits** at a 70% rate
- **Credits** are what users actually earn and can withdraw

## Conversion Logic

### Basic Conversion Formula
```
Credits Earned = Floor(Coins Sent × 0.7)
```

### Example Scenarios
- User A sends 1000 coins → User B receives 700 credits
- User A sends 100 coins → User B receives 70 credits  
- User A sends 50 coins → User B receives 35 credits

## Database Schema Changes

### 1. stream_gifts Table
Added new column to track credits earned:
```sql
ALTER TABLE stream_gifts ADD COLUMN credits_earned INTEGER NOT NULL DEFAULT 0;
```

### 2. Column Descriptions
- `coins_cost`: Original cost of the gift in coins (from gifts table)
- `coins_amount`: Original amount of coins sent (stored in stream_gifts)
- `credits_earned`: Credits received by the receiver (70% of coins_amount)

### 3. Database Functions

#### get_user_earnings_with_credits(user_id UUID)
Calculates total credits earned from all gifts received:
```sql
SELECT COALESCE(SUM(sg.credits_earned), 0) 
FROM stream_gifts sg 
WHERE sg.receiver_id = user_id;
```

#### get_top_gifter_with_credits(receiver_id UUID)
Finds the user who sent the most credits to a specific user:
```sql
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
```

#### get_top_gifts_with_credits(receiver_id UUID, limit_count INTEGER)
Finds the most valuable gifts received by credits earned:
```sql
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
```

#### can_message_user_with_credits(sender_id UUID, receiver_id UUID)
Checks if a user can message another user based on credits sent:
```sql
SELECT COALESCE(SUM(credits_earned), 0) >= 99
FROM stream_gifts
WHERE sender_id = $1 AND receiver_id = $2;
```

## Backend Implementation

### 1. Gift Sending Logic (payments.js)

When a gift is sent, the system:
1. Calculates credits earned: `creditsEarned = Math.floor(coinsSent * 0.7)`
2. Stores both original coins and calculated credits
3. Updates receiver's total credits earned
4. Creates transaction records for both sender and receiver

```javascript
// Calculate credits earned by receiver (70% of coins sent)
const coinsSent = gift.gems_cost;
const creditsEarned = Math.floor(coinsSent * 0.7); // 70% conversion rate

// Create gift transaction
const { data: giftTransaction, error: giftTransactionError } = await supabaseAdmin
  .from('stream_gifts')
  .insert({
    stream_id: stream_id,
    sender_id: req.user.id,
    receiver_id: receiver_id,
    gift_id: gift_id,
    coins_amount: coinsSent, // Store original coins sent
    credits_earned: creditsEarned, // Store credits earned by receiver (70% conversion)
    message: message || null
  })
  .select()
  .single();

// Update receiver's credits_earned in users table
await supabaseAdmin
  .from('users')
  .update({ 
    credits_earned: supabaseAdmin.raw(`credits_earned + ${creditsEarned}`),
    updated_at: new Date().toISOString()
  })
  .eq('id', receiver_id);
```

### 2. Earnings Calculation (payments.js)

The earnings endpoint now calculates total credits from the `credits_earned` column:
```javascript
// Calculate total credits earned from stream_gifts table
const { data: gifts, error: giftsError } = await supabaseAdmin
  .from('stream_gifts')
  .select('credits_earned')
  .eq('receiver_id', req.user.id);

const totalCredits = gifts ? gifts.reduce((sum, gift) => sum + (gift.credits_earned || 0), 0) : 0;
```

### 3. Withdrawal Logic (payments.js)

Withdrawals are now based on credits earned:
```javascript
// Get user's current balance using new credits function
const { data: earnings, error: earningsError } = await supabaseAdmin
  .rpc('get_user_earnings_with_credits', { user_id: req.user.id });

const totalCredits = earnings && earnings.length > 0 ? earnings[0].credits_earned : 0;

if (totalCredits < amount) {
  return res.status(400).json({ error: 'Insufficient credit balance' });
}
```

## Frontend Updates

### 1. API Interface Updates (services/api.ts)

Updated interfaces to use credits:
```typescript
export interface EarningsData {
  credits_earned: number; // Changed from coins_earned
  total_earnings: number;
  total_gifts: number;
  withdrawal_threshold: number;
  can_withdraw: boolean;
  kyc_required: boolean;
  kyc_status: 'pending' | 'verified' | 'rejected';
  first_withdrawal_completed: boolean;
}
```

### 2. Profile Display (app/(tabs)/profile.tsx)

Updated to display credits instead of coins:
```typescript
<Text style={styles.earningsAmount}>
  {earnings?.credits_earned?.toLocaleString() || 0} credits
</Text>
<Text style={styles.earningsSubtitle}>
  {earnings?.can_withdraw ? "Ready to withdraw!" : `${remainingCoins} credits needed`}
</Text>
```

### 3. User Profile Display (app/profile/[userId].tsx)

Updated to show credits earned:
```typescript
<View style={styles.statItem}>
  <Gift size={20} color="#FFD700" />
  <Text style={styles.statNumber}>{user.credits_earned || 0}</Text>
  <Text style={styles.statLabel}>Credits</Text>
</View>
```

## Database Migration

### Migration Script: database/add-credits-earned-column.sql

This script:
1. Adds `credits_earned` column to `stream_gifts` table
2. Updates existing records with calculated credits (70% of coins_amount)
3. Creates new database functions for credits-based calculations
4. Adds database trigger to automatically calculate credits_earned
5. Creates indexes for better performance

### Running the Migration

Execute the migration script in your Supabase SQL editor:
```sql
-- Run the migration script
\i database/add-credits-earned-column.sql
```

## Key Benefits

1. **Clear Separation**: Coins (purchasable) vs Credits (earned)
2. **Automatic Conversion**: 70% conversion happens automatically when gifts are sent
3. **Accurate Tracking**: Both original coins and converted credits are stored
4. **Performance**: Database indexes optimize queries
5. **Consistency**: All calculations use the same conversion rate

## Testing the System

### 1. Send a Gift
```bash
POST /api/payments/send-gift
{
  "stream_id": "uuid",
  "gift_id": "uuid", 
  "receiver_id": "uuid",
  "message": "Test gift"
}
```

Expected response:
```json
{
  "message": "Gift sent successfully",
  "conversion": {
    "coins_sent": 100,
    "credits_earned": 70,
    "conversion_rate": "70%"
  }
}
```

### 2. Check Earnings
```bash
GET /api/payments/earnings
```

Expected response:
```json
{
  "credits_earned": 70,
  "total_earnings": 140,
  "total_gifts": 1,
  "withdrawal_threshold": 5000,
  "can_withdraw": false
}
```

## Important Notes

1. **Backward Compatibility**: Existing coins data is preserved in `coins_amount` column
2. **Conversion Rate**: Fixed at 70% - can be adjusted in the database trigger
3. **Rounding**: Uses `Math.floor()` to ensure no fractional credits
4. **Performance**: Database indexes optimize queries on `credits_earned`
5. **Audit Trail**: Both original coins and converted credits are stored for transparency

## Future Enhancements

1. **Dynamic Conversion Rates**: Could be made configurable per gift type
2. **Conversion History**: Track conversion rates over time
3. **Analytics**: Detailed reporting on coins vs credits
4. **Admin Controls**: Allow admins to adjust conversion rates
