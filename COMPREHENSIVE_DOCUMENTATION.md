# Live Streaming App - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Environment Setup](#environment-setup)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Authentication System](#authentication-system)
9. [Third-Party Integrations](#third-party-integrations)
10. [Implementation Features](#implementation-features)
11. [Troubleshooting](#troubleshooting)
12. [Deployment Guide](#deployment-guide)

---

## Project Overview

A React Native live streaming app built with Expo, Hono backend, and Supabase. Features include real-time streaming, virtual economy, social features, and comprehensive user profiles.

### Tech Stack
- **Frontend**: React Native with Expo
- **Backend**: Hono (lightweight web framework)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Supabase Auth
- **File Storage**: Cloudflare R2
- **Payment Processing**: Cashfree Payout API

---

## Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- Bun package manager
- Supabase account and project
- Expo CLI

### Installation & Setup

1. **Install Dependencies**
```bash
bun install
```

2. **Start the Server**
```bash
bun start
```

This will:
- Start the Hono backend server
- Create a tunnel to make it accessible at: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev`
- Start the Expo development server

3. **Environment Variables**
Your `.env` file is already configured with:
- `EXPO_PUBLIC_RORK_API_BASE_URL=https://dev-bo44fwxvov01657rf6ttq.rorktest.dev`
- Supabase credentials
- JWT secret

4. **API Endpoints**
Once the server is running, you can access:
- **API Root**: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev/api/`
- **Health Check**: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev/api/health`
- **API Docs**: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev/api/docs`

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in your project root with:

```env
# Supabase Configuration (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (REQUIRED)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-ngrok-url.ngrok-free.app

# Backend Environment Variables
JWT_SECRET=your_jwt_secret
EXPO_PUBLIC_JWT_SECRET=your_jwt_secret

# Cloudflare R2 Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET=live-streaming-app-media
R2_ACCESS_KEY=your_access_key_id
R2_SECRET_KEY=your_secret_access_key
R2_PUBLIC_URL=https://your-cdn-domain.com

# Cashfree Payout API Configuration
CASHFREE_CLIENT_ID=your_cashfree_client_id
CASHFREE_CLIENT_SECRET=your_cashfree_client_secret

# Other Configuration
APP_ENV=development
BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### How to Get Credentials

#### Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy Project URL, anon public key, and service_role secret

#### Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Copy your **OAuth 2.0 Client ID**

#### Cloudflare R2 Credentials
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Create bucket and API token
4. Copy Access Key ID and Secret Access Key

---

## Backend Architecture

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Supabase configuration
│   ├── middleware/
│   │   └── auth.js             # Authentication middleware
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User management routes
│   │   ├── streaming.js        # Streaming routes
│   │   ├── payments.js         # Payment routes
│   │   ├── notifications.js    # Notification routes
│   │   └── media.js            # Media upload routes
│   ├── utils/
│   │   └── jwt.js              # JWT utilities
│   └── server.js               # Main server file
├── package.json                # Backend dependencies
└── env.example                 # Environment variables template
```

### Server Setup Options

#### Option 1: Run server directly
```bash
bun run server.ts
```

#### Option 2: Run with auto-reload (recommended for development)
```bash
bun --watch server.ts
```

#### Option 3: Run both server and Expo app together
```bash
bun run concurrently "bun --watch server.ts" "bun run start"
```

---

## Frontend Architecture

### Project Structure
```
app/
├── _layout.tsx                 # Root layout
├── (tabs)/
│   ├── _layout.tsx             # Tab navigation
│   ├── home.tsx                # Home screen
│   ├── go-live.tsx             # Go live screen
│   ├── chat.tsx                # Chat screen
│   ├── profile.tsx             # Profile screen
│   └── wallet.tsx              # Wallet screen
├── auth.tsx                    # Authentication screen
├── onboarding.tsx              # Onboarding carousel
└── index.tsx                   # Splash screen

components/
├── GiftAnimation.tsx           # Gift animation component
├── GoogleSignInButton.tsx      # Google OAuth button
├── LoginScreen.tsx             # Login screen component
├── LogViewer.tsx               # Log viewer component
├── NetworkTest.tsx             # Network test component
└── ProfileImageViewer.tsx     # Profile image viewer

providers/
├── AuthProvider.tsx            # Authentication context
├── NotificationProvider.tsx    # Notification context
├── StreamProvider.tsx          # Stream context
└── WalletProvider.tsx          # Wallet context

services/
├── api.ts                      # API client
├── authService.ts              # Authentication service
├── googleAuth.ts               # Google OAuth service
└── profileService.ts           # Profile service
```

### Navigation Flow
```
1. App Launch → Splash Screen (2 seconds)
2. Splash Screen → Onboarding (first-time users)
3. Onboarding → Authentication Screen
4. Authentication → Main App Tabs
5. Profile Screen → All features working
6. Settings → Customer support working
7. Logout → Proper session termination
```

---

## API Documentation

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-api-domain.com`

### Authentication
The API uses **JWT (JSON Web Tokens)** for authentication with two token types:
- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal

### Core Endpoints

#### Authentication
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP and login/signup
- `POST /api/auth/email/signup` - Email signup
- `POST /api/auth/email/login` - Email login
- `POST /api/auth/google/init` - Google OAuth initiation
- `POST /api/auth/google/exchange` - Google OAuth token exchange
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

#### User Management
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:userId/follow` - Follow user
- `DELETE /api/users/:userId/follow` - Unfollow user
- `GET /api/users/:userId/followers` - Get user followers
- `GET /api/users/:userId/following` - Get user following
- `GET /api/users/search` - Search users

#### Streaming
- `POST /api/streaming` - Create new stream
- `GET /api/streaming/live` - Get live streams
- `GET /api/streaming/:streamId` - Get stream by ID
- `POST /api/streaming/:streamId/start` - Start stream
- `POST /api/streaming/:streamId/end` - End stream
- `GET /api/streaming/user/:userId` - Get user's streams
- `DELETE /api/streaming/:streamId` - Delete stream

#### Payments & Gifts
- `GET /api/payments/gifts` - Get available gifts
- `POST /api/payments/purchase-coins` - Purchase coins
- `POST /api/payments/send-gift` - Send gift to streamer
- `GET /api/payments/transactions` - Get user transactions
- `GET /api/payments/earnings` - Get user earnings
- `POST /api/payments/withdraw` - Request withdrawal

#### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:notificationId` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

#### Media Management
- `POST /api/media/upload-url` - Generate upload URL
- `POST /api/media/profile-picture` - Upload profile picture
- `GET /api/media/my-files` - Get user's files
- `DELETE /api/media/:fileId` - Delete file
- `GET /api/media/:fileId` - Get file by ID

#### Health Check
- `GET /health` - Health check endpoint

### Error Codes
| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    bio TEXT,
    profile_pic TEXT,
    profile_picture_url TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) DEFAULT 'pending',
    kyc_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Streams Table
```sql
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status VARCHAR(20) DEFAULT 'created',
    viewer_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Followers Table
```sql
CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);
```

#### Stream Gifts Table
```sql
CREATE TABLE stream_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES gifts(id),
    coins_amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Support Complaints Table
```sql
CREATE TABLE support_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Functions

#### Stream Duration Functions
```sql
-- Weekly stream duration
get_user_stream_duration_weekly(user_uuid UUID)

-- Monthly stream duration  
get_user_stream_duration_monthly(user_uuid UUID)
```

#### Analytics Functions
```sql
-- Top gifter for user
get_user_top_gifter(user_uuid UUID)

-- Top gifts for user
get_user_top_gifts(user_uuid UUID, limit_count INTEGER)

-- Message permission check
can_user_message(sender_uuid UUID, receiver_uuid UUID)
```

### Database Triggers
```sql
-- Follower count updates
CREATE TRIGGER update_follower_counts_trigger
    AFTER INSERT OR DELETE ON followers
    FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Like count updates  
CREATE TRIGGER update_user_stats_on_like_trigger
    AFTER INSERT OR DELETE ON stream_likes
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_like();

-- Coin count updates
CREATE TRIGGER update_user_stats_on_gift_trigger
    AFTER INSERT OR DELETE ON stream_gifts
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_gift();
```

---

## Authentication System

### Authentication Methods

#### 1. Phone OTP Authentication
- Send OTP to phone number
- Verify OTP for login/signup
- Automatic user creation on first signup

#### 2. Email Authentication
- Email/password signup with email verification
- Email/password login
- Password reset (handled by Supabase)

#### 3. Google OAuth
- Google OAuth integration with Supabase Auth
- Expo AuthSession for proper mobile OAuth handling
- Dynamic redirect URI generation

### OAuth Flow Process

#### Mobile App Flow
1. App calls `/api/auth/google/init`
2. Backend returns Supabase OAuth URL
3. App opens OAuth URL in WebBrowser
4. User authenticates with Google
5. Google redirects to Expo Auth Proxy
6. Expo Auth Proxy sends result back to app
7. App extracts authorization code from URL
8. App calls `/api/auth/google/exchange` with code
9. Backend exchanges code for Supabase session
10. Backend creates/updates user in database
11. Backend returns user data + JWT tokens
12. App stores tokens and navigates to main screen

### Token Management
- **Supabase tokens**: For Supabase Auth operations
- **JWT tokens**: For your backend API authentication
- **Token validation**: All endpoints validate tokens
- **Error handling**: Comprehensive error responses

---

## Third-Party Integrations

### Cloudflare R2 Setup

#### R2 Configuration
```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET=live-streaming-app-media
R2_ACCESS_KEY=your_access_key_id
R2_SECRET_KEY=your_secret_access_key
R2_PUBLIC_URL=https://your-cdn-domain.com
```

#### R2 Upload Process
1. **File Selection**: User selects image from camera/gallery
2. **Filename Generation**: `username_userid.jpg` format
3. **R2 Upload**: Direct upload using AWS4 signature
4. **Database Update**: Store public R2 URL
5. **UI Refresh**: Immediate profile picture update

#### Security Features
- **Authentication**: JWT token required
- **File Validation**: Only image files allowed
- **Size Limit**: 5MB maximum
- **Filename Sanitization**: Remove special characters

### Cashfree Payout API Setup

#### Supported Withdrawal Methods
1. **Bank Transfer**
```javascript
{
  withdrawal_method: 'bank',
  account_details: {
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234'
  }
}
```

2. **UPI Transfer**
```javascript
{
  withdrawal_method: 'upi',
  account_details: {
    upiId: 'user@upi'
  }
}
```

3. **PayPal Transfer**
```javascript
{
  withdrawal_method: 'paypal',
  account_details: {
    paypalEmail: 'user@paypal.com'
  }
}
```

#### API Flow
1. **User requests withdrawal** → Frontend calls `/api/payments/withdraw`
2. **Backend validates** → Checks balance, validates input
3. **Creates transaction** → Records in database
4. **Cashfree API call** → Creates beneficiary and initiates transfer
5. **Update status** → Updates transaction with Cashfree response
6. **Deduct balance** → Reduces user's coin balance

#### Environment Configuration
```env
CASHFREE_CLIENT_ID=your_cashfree_client_id
CASHFREE_CLIENT_SECRET=your_cashfree_client_secret
NODE_ENV=development  # Uses gamma (test) API
```

---

## Implementation Features

### User Profile System

#### Basic Profile Information
- **Profile Picture**: Large circular display with upload capability
- **Username**: Displayed prominently with verification badge
- **Bio**: Short text description for self-expression
- **KYC Status**: Visual badges for verification status

#### Social Stats Display
- **Followers Count**: Real-time updated count
- **Following Count**: Real-time updated count  
- **Total Likes**: Aggregated from all streams
- **Total Coins Earned**: Calculated from all gifts received

#### Follow/Unfollow System
- **Follow Button**: Toggle follow status for other users
- **Real-time Updates**: Automatic follower/following count updates
- **Database Structure**: Proper followers table with unique constraints

#### Message System
- **99 Coin Threshold**: Message button only enabled after sending 99+ coins
- **Server Validation**: Backend function validates threshold
- **UI Feedback**: Button shows "Locked" when threshold not met

### Real-time Analytics

#### Stream Duration Charts
- **Weekly Chart**: Daily streaming hours for the week
- **Monthly Chart**: Weekly streaming hours for the month
- **Visual Style**: Animated bar charts with brand colors
- **Data Source**: Real-time stream duration from API

#### Top Gifter Feature
- **Database Function**: Identifies highest coin sender
- **API Endpoint**: `/users/:userId/top-gifter`
- **Frontend Display**: Shows top gifter username and total coins sent

#### Top Gifts Display
- **Database Function**: Ranks gifts by coin value
- **API Endpoint**: `/users/:userId/top-gifts`
- **Frontend Display**: Shows gift icons, names, and total coins

### Splash Screen & Onboarding

#### Splash Screen Features
- **Vibrant Gen-Z Color Scheme**: Linear gradient with `#6900D1`, `#E30CBD`, `#FF006E`
- **App Logo**: Animated circular logo with "DS" branding
- **Tagline**: "Go Live & Connect Worldwide"
- **Auto-Progress**: 2-second delay before navigation
- **Smart Navigation Logic**: Routes based on user state

#### Onboarding Carousel
- **3 Engaging Slides**:
  1. "Go Live & Earn Rewards" - Heart icon, pink gradient
  2. "Meet New Friends Worldwide" - Users icon, purple gradient  
  3. "Send Virtual Gifts" - Gift icon, orange gradient
- **Interactive Elements**: Progress indicators, skip option, swipe navigation
- **Gen-Z Visual Style**: Playful, vibrant gradients and bold typography

### Customer Support System
- **Support Complaints Table**: Full database integration
- **API Endpoints**: Submit and retrieve complaints
- **Frontend Integration**: Form validation and user feedback
- **Status Tracking**: Open, in_progress, resolved, closed statuses

---

## Troubleshooting

### Common Issues

#### Server Not Starting
1. Make sure you're in the project root directory
2. Run `bun start` (not `npm start` or `yarn start`)
3. Check that port 3000 is not in use

#### Network Request Failed
1. Ensure the server is running with `bun start`
2. Check that the tunnel URL is accessible
3. Verify `.env` has the correct `EXPO_PUBLIC_RORK_API_BASE_URL`

#### JSON Parse Error
This usually means the server is returning HTML instead of JSON:
1. Check server logs for errors
2. Verify the API endpoint exists
3. Test endpoints manually in browser or Postman

#### Authentication Errors
1. Check that JWT_SECRET is properly set
2. Verify Supabase credentials and connection
3. Ensure tokens are being sent in Authorization header

#### R2 Upload Issues
1. **"R2 upload failed"**: Check R2 credentials and bucket permissions
2. **"Permission denied"**: Verify R2_ACCESS_KEY and R2_SECRET_KEY
3. **"File not found"**: Check R2_PUBLIC_URL configuration

#### Database Errors
1. Verify Supabase credentials and connection
2. Check that schema was created correctly
3. Verify RLS policies if data access issues occur

### Debug Steps

#### Check Environment Variables
```bash
echo $SUPABASE_URL
echo $JWT_SECRET
echo $R2_ENDPOINT
```

#### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

#### Monitor Backend Logs
- Check backend console for detailed error messages
- Monitor R2 bucket for uploaded files
- Verify database updates

---

## Deployment Guide

### Backend Deployment

#### 1. Build the Backend
```bash
cd backend
npm run build
```

#### 2. Set Production Environment Variables
```env
NODE_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://your-production-domain.com
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
JWT_SECRET=your_production_jwt_secret
R2_ENDPOINT=https://your-production-account.r2.cloudflarestorage.com
R2_BUCKET=your-production-bucket
R2_ACCESS_KEY=your_production_access_key
R2_SECRET_KEY=your_production_secret_key
CASHFREE_CLIENT_ID=your_production_cashfree_client_id
CASHFREE_CLIENT_SECRET=your_production_cashfree_client_secret
```

#### 3. Deploy to Your Preferred Service
- **Heroku**: Use Heroku CLI or GitHub integration
- **Vercel**: Connect GitHub repository
- **Railway**: Deploy from GitHub
- **DigitalOcean**: Use App Platform

### Frontend Deployment

#### 1. Update API Base URL
```env
EXPO_PUBLIC_API_BASE_URL=https://your-production-api-domain.com
```

#### 2. Build for Production
```bash
# For iOS
expo build:ios

# For Android
expo build:android

# For Web
expo build:web
```

#### 3. Deploy Using Expo Services
- **Expo Application Services (EAS)**: For app store deployment
- **Expo Web**: For web deployment
- **Expo Go**: For testing

### Production Checklist

#### Security
- ✅ All environment variables set for production
- ✅ HTTPS enabled for all endpoints
- ✅ CORS configured for production domains
- ✅ Rate limiting enabled
- ✅ Input validation active
- ✅ Error messages sanitized

#### Performance
- ✅ Database indexes created
- ✅ CDN configured for R2
- ✅ Image optimization enabled
- ✅ Caching strategies implemented
- ✅ Monitoring and logging active

#### Testing
- ✅ All API endpoints tested
- ✅ Authentication flows verified
- ✅ File uploads working
- ✅ Payment processing tested
- ✅ Error handling verified

---

## Support & Resources

### Documentation
- **API Documentation**: Available at `/api/docs` when server is running
- **Postman Collection**: `LIVE_STREAMING_API_POSTMAN_COLLECTION.json`
- **Database Schema**: `database/schema.sql`

### Development Tools
- **Network Test Component**: Built-in network connectivity testing
- **Log Viewer Component**: Real-time log monitoring
- **Debug Settings**: `debug-settings.js` for development configuration

### Contact
- **API Support**: Check server logs and error messages
- **Database Issues**: Verify Supabase configuration
- **Frontend Issues**: Check Expo development tools

---

*This comprehensive documentation covers all aspects of the Live Streaming App implementation, from setup to deployment. For specific implementation details, refer to the individual feature documentation files.*
