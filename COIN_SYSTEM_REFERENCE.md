# 💎 Credit System Reference - Live Streaming App

## 📋 Table of Contents
- [Database Schema](#database-schema)
- [Backend API Endpoints](#backend-api-endpoints)
- [Frontend Components](#frontend-components)
- [Coin System Features](#coin-system-features)
- [Security & Validation](#security--validation)
- [Analytics & Tracking](#analytics--tracking)
- [Business Logic](#business-logic)
- [File References](#file-references)

---

## 🏗️ Database Schema

### Tables with Coin Fields

#### 1. `users` Table
```sql
credits_earned INTEGER DEFAULT 0
```
- **Purpose:** Total credits earned from gifts received
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:33`
- **Usage:** User profile stats, withdrawal eligibility

#### 2. `streams` Table
```sql
credits_earned INTEGER DEFAULT 0
```
- **Purpose:** Credits earned per individual stream
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:135`
- **Usage:** Stream analytics, earnings tracking

#### 3. `gifts` Table
```sql
gems_cost INTEGER NOT NULL
```
- **Purpose:** Cost of each gift in gems
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:198`
- **Migration:** Previously `coin_value` (renamed to `gems_cost`)
- **Usage:** Gift pricing, purchase validation

#### 4. `stream_gifts` Table
```sql
gems_amount INTEGER NOT NULL DEFAULT 0
```
- **Purpose:** Amount of gems for each gift sent
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:251`
- **Usage:** Transaction tracking, analytics

### Database Functions

#### 1. `get_top_gifter()`
```sql
-- Returns user who sent most coins
total_coins_sent INTEGER
```
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:693`
- **Usage:** Profile highlights, leaderboards

#### 2. `get_top_gifts()`
```sql
-- Returns gifts ranked by coin value
total_coins INTEGER
```
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:716`
- **Usage:** Gift analytics, user insights

#### 3. `can_message_user()`
```sql
-- Checks if 99+ coins were sent (message threshold)
total_coins_sent INTEGER;
SELECT COALESCE(SUM(coins_amount), 0) INTO total_coins_sent
RETURN total_coins_sent >= 99;
```
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:750`
- **Usage:** Message access control

---

## 🔧 Backend API Endpoints

### Payment Routes (`/api/payments/`)

#### 1. `GET /earnings`
```javascript
// Get user's coin earnings
{
  coins_earned: number,
  total_earnings: number,
  withdrawal_threshold: 5000,
  can_withdraw: boolean
}
```
- **Location:** `backend/src/routes/payments.js:22`
- **Usage:** Profile earnings display, withdrawal eligibility

#### 2. `POST /purchase-coins`
```javascript
// Purchase coins with payment
{
  amount: number,
  payment_method: string
}
```
- **Location:** `backend/src/routes/payments.js:362`
- **Usage:** Coin purchase flow

#### 3. `POST /send-gift`
```javascript
// Send gift (deducts coins)
{
  stream_id: string,
  gift_id: string,
  receiver_id: string,
  message?: string
}
```
- **Location:** `backend/src/routes/payments.js:431`
- **Usage:** Live streaming gift system

#### 4. `POST /withdraw`
```javascript
// Withdraw earned coins (5000 minimum)
{
  amount: number,
  withdrawal_method: string,
  account_details: object
}
```
- **Location:** `backend/src/routes/payments.js:180`
- **Usage:** Creator earnings withdrawal

### User Routes (`/api/users/`)

#### 1. `GET /:userId/stream-duration`
- **Purpose:** Stream duration analytics
- **Location:** `backend/src/routes/users.js`

#### 2. `GET /:userId/top-gifter`
- **Purpose:** Top gifter by coins sent
- **Location:** `backend/src/routes/users.js`

#### 3. `GET /:userId/top-gifts`
- **Purpose:** Top gifts by coin value
- **Location:** `backend/src/routes/users.js`

---

## 📱 Frontend Components

### Profile Screens

#### 1. `app/(tabs)/profile.tsx`
```typescript
// Shows coins earned, withdrawal progress
const progressPercentage = Math.min((earnings?.coins_earned || 0) / 5000 * 100, 100);
const remainingCoins = Math.max(5000 - (earnings?.coins_earned || 0), 0);
```
- **Features:** Earnings display, withdrawal progress bar
- **Key Functions:** `loadEarningsData()`, progress calculation

#### 2. `app/profile/[userId].tsx`
```typescript
// Shows user's coins earned
<Text style={styles.statNumber}>{user.coins_earned || 0}</Text>
<Text style={styles.statLabel}>Coins</Text>
```
- **Features:** Public profile coin stats
- **Usage:** User discovery, social features

#### 3. `app/earnings.tsx`
```typescript
// Detailed earnings and withdrawal interface
const progressPercentage = Math.min((earnings?.coins_earned || 0) / 5000 * 100, 100);
const remainingCoins = Math.max(5000 - (earnings?.coins_earned || 0), 0);
```
- **Features:** Withdrawal form, KYC status, progress tracking
- **Key Functions:** `handleWithdrawal()`, validation

### Wallet & Purchases

#### 1. `app/(tabs)/wallet.tsx`
```typescript
// Wallet balance and transactions
const { coins, transactions, purchaseCoins } = useWallet();
```
- **Features:** Balance display, transaction history
- **Navigation:** Links to purchase and withdrawal

#### 2. `app/purchase-coins.tsx`
```typescript
// Coin purchase interface
const handlePurchase = (pkg: CoinPackage) => {
  await purchaseCoins(pkg.coins + pkg.bonus, total);
};
```
- **Features:** Package selection, payment processing
- **Key Functions:** `handlePurchase()`, package validation

#### 3. `app/wallet.tsx`
```typescript
// Main wallet screen
const { coins, transactions, purchaseCoins } = useWallet();
```
- **Features:** Comprehensive wallet management
- **Integration:** WalletProvider integration

### Streaming

#### 1. `app/stream/[streamId].tsx`
```typescript
// Gift sending during streams
const handleSendGift = async (gift: any) => {
  if (coins < gift.cost) {
    Alert.alert("Insufficient Coins", "You need more coins to send this gift");
    return;
  }
  const success = await deductCoins(gift, currentStream?.username || "Streamer");
  sendGift(gift.name, user?.username || "Anonymous");
};
```
- **Features:** Real-time gift sending, balance validation
- **Key Functions:** `handleSendGift()`, balance checks

#### 2. `app/broadcast.tsx`
```typescript
// Live streaming with gift tracking
const giftCoins = [1,10,100,250][Math.floor(Math.random()*4)];
setGiftsEarned((g) => g + giftCoins);
setMessages((prev) => [...prev, { 
  id: Math.random().toString(), 
  text: `sent a gift (${giftCoins} coins)`, 
  username: `gifter_${prev.length%10}`, 
  isGift: true 
}]);
```
- **Features:** Live gift notifications, earnings tracking
- **Key Functions:** Gift simulation, earnings calculation

---

## 💰 Coin System Features

### 1. Coin Purchase
```typescript
// Purchase coins
async purchaseCoins(amount: number, paymentMethod: string): Promise<{
  message: string;
  transaction: Transaction;
}>
```
- **Location:** `services/api.ts:461`
- **Features:** Multiple payment methods, transaction tracking

### 2. Gift System
```typescript
// Send gifts (costs coins)
async sendGift(
  streamId: string, 
  giftId: string, 
  receiverId: string, 
  message?: string
): Promise<{
  message: string;
  gift: Gift;
  transaction_id: string;
}>
```
- **Location:** `services/api.ts:468`
- **Features:** Real-time sending, message support

### 3. Earnings & Withdrawal
- **Minimum withdrawal:** 5000 coins
- **Progress tracking:** Shows progress toward 5000 coin threshold
- **KYC requirement:** Required for first withdrawal
- **Location:** `app/earnings.tsx`, `backend/src/routes/payments.js`

### 4. Gift Costs
```javascript
// Gift pricing structure
const gifts = [
  { name: 'Rose', icon: '🌹', coins_cost: 10, description: 'A beautiful rose' },
  { name: 'Heart', icon: '❤️', coins_cost: 50, description: 'Show your love' },
  { name: 'Crown', icon: '👑', coins_cost: 100, description: 'Royal gift' },
  { name: 'Diamond', icon: '💎', coins_cost: 500, description: 'Precious diamond' },
  { name: 'Rocket', icon: '🚀', coins_cost: 1000, description: 'To the moon!' }
];
```
- **Location:** `fix-database.js:223-227`
- **Range:** 10-1000 coins per gift

---

## 🔐 Security & Validation

### Message Threshold
```sql
-- Users must send 99+ coins to message another user
CREATE OR REPLACE FUNCTION can_message_user(
  sender_id UUID,
  receiver_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  total_coins_sent INTEGER;
BEGIN
  SELECT COALESCE(SUM(coins_amount), 0) INTO total_coins_sent
  FROM stream_gifts
  WHERE sender_id = $1 AND receiver_id = $2;
  
  RETURN total_coins_sent >= 99;
END;
$$ LANGUAGE plpgsql;
```
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:750`
- **Purpose:** Prevent spam, encourage engagement

### Withdrawal Rules
```javascript
// Minimum 5000 coins required
if (amount < 5000) {
  return res.status(400).json({ 
    error: 'Minimum withdrawal amount is 5000 coins' 
  });
}

// KYC verification required for first withdrawal
const kycRequired = finalCoinsEarned >= 5000 && !firstWithdrawalCompleted;
const canWithdraw = finalCoinsEarned >= 5000 && 
  (kycStatus === 'verified' || firstWithdrawalCompleted);
```
- **Location:** `backend/src/routes/payments.js:180,68-69`
- **Features:** Amount validation, KYC enforcement

### Balance Validation
```javascript
// Check sufficient balance before withdrawal
if (totalCoins < amount) {
  return res.status(400).json({ 
    error: 'Insufficient coin balance' 
  });
}
```
- **Location:** `backend/src/routes/payments.js:199`
- **Purpose:** Prevent overdraft, maintain integrity

---

## 📊 Analytics & Tracking

### User Stats
```typescript
// Total coins earned
coins_earned: number;

// Coins sent to others
total_coins_sent: number;

// Gift history and costs
total_coins: number;
```
- **Location:** `services/api.ts:15,124,133`
- **Usage:** Profile analytics, social features

### Stream Analytics
```sql
-- Coins earned per stream
SELECT SUM(coins_amount) as total_coins_earned
FROM stream_gifts
WHERE receiver_id = $1 AND stream_id = $2;

-- Top gifters by coin amount
SELECT sender_id, SUM(coins_amount) as total_coins_sent
FROM stream_gifts
WHERE receiver_id = $1
GROUP BY sender_id
ORDER BY total_coins_sent DESC;
```
- **Location:** `COMPREHENSIVE_DATABASE_SCHEMA.sql:700,724`
- **Usage:** Creator insights, engagement metrics

### Real-time Tracking
```typescript
// Live gift tracking
const giftCoins = [1,10,100,250][Math.floor(Math.random()*4)];
setGiftsEarned((g) => g + giftCoins);
```
- **Location:** `app/broadcast.tsx:67-69`
- **Features:** Instant updates, live notifications

---

## 🎯 Business Logic

### Coin Flow
```
Purchase → Send Gifts → Earn Coins → Withdraw
```

1. **Purchase:** Users buy coins with real money
2. **Send Gifts:** Coins spent on virtual gifts during streams
3. **Earn Coins:** Streamers receive coins from gifts
4. **Withdraw:** Convert earned coins to real money

### Thresholds
- **99 coins:** Minimum required to message another user
- **5000 coins:** Minimum required for withdrawal
- **KYC:** Required for first withdrawal

### Validation Rules
```javascript
// Server-side checks for sufficient balance
if (coins < gift.cost) {
  Alert.alert("Insufficient Coins", "You need more coins to send this gift");
  return;
}

// Withdrawal validation
if (amount > earnings.coins_earned) {
  Alert.alert('Error', 'Insufficient coin balance');
  return;
}
```

### Tracking & Audit
- Complete audit trail of coin transactions
- Real-time balance updates
- Transaction history for all users
- Analytics for creators and platform

---

## 📁 File References

### Database Files
- `COMPREHENSIVE_DATABASE_SCHEMA.sql` - Main schema with coin fields
- `fix-database.js` - Gift data with coin costs
- `apply-schema.js` - Schema application utilities

### Backend Files
- `backend/src/routes/payments.js` - Payment and coin APIs
- `backend/src/routes/auth.js` - User creation with coin fields
- `backend/src/routes/users.js` - User analytics with coin data

### Frontend Files
- `app/(tabs)/profile.tsx` - Profile with coin earnings
- `app/earnings.tsx` - Earnings and withdrawal interface
- `app/purchase-coins.tsx` - Coin purchase flow
- `app/stream/[streamId].tsx` - Live streaming with gifts
- `app/broadcast.tsx` - Broadcasting with coin tracking

### Service Files
- `services/api.ts` - API client with coin methods
- `services/authService.ts` - Auth with coin user data
- `providers/WalletProvider.tsx` - Wallet state management

### Configuration Files
- `LIVE_STREAMING_API_POSTMAN_COLLECTION.json` - API documentation
- `COMPREHENSIVE_DOCUMENTATION.md` - System documentation

---

## 🎉 Summary

The coin system is the **central monetization engine** of your live streaming app, enabling:

1. **Virtual Economy:** Users purchase and spend coins on gifts
2. **Creator Earnings:** Streamers earn coins from gifts and withdraw
3. **Engagement:** Coin thresholds encourage user interaction
4. **Analytics:** Complete tracking of coin flow and user behavior
5. **Security:** Server-side validation prevents fraud and abuse

The system is **well-architected** with proper separation of concerns, comprehensive validation, and real-time tracking capabilities! 🚀
