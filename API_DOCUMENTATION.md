# 🚀 Live Streaming App API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [User Management](#user-management)
  - [User Analytics](#user-analytics)
  - [Streaming](#streaming)
  - [Payments & Gifts](#payments--gifts)
  - [Notifications](#notifications)
  - [Media Management](#media-management)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Testing Guide](#testing-guide)

## 📖 Overview

This API provides a complete backend for a live streaming application with the following features:

- **Authentication**: Google OAuth, Email/Password, Phone OTP
- **User Profiles**: Complete user management with KYC verification
- **Live Streaming**: Stream creation, management, and real-time stats
- **Virtual Economy**: Coin system, gifts, and earnings
- **Social Features**: Follow/unfollow, messaging with coin thresholds
- **Media Management**: Profile pictures and file uploads
- **Real-time Analytics**: Stream duration, top gifters, and statistics

## 🔐 Authentication

The API uses **JWT (JSON Web Tokens)** for authentication with two token types:

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal

### Token Usage
```http
Authorization: Bearer <access_token>
```

### Token Refresh
When access tokens expire (401 error), use the refresh token to get new ones:
```http
POST /api/auth/refresh
{
  "refreshToken": "your_refresh_token"
}
```

## 🌐 Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-api-domain.com`

---

## 📡 API Endpoints

### 🔐 Authentication Endpoints

#### 1. Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "message": "API is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Root Endpoint
```http
GET /
```
**Response:**
```json
{
  "status": "ok",
  "message": "Live Streaming API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "streaming": "/api/streaming",
    "payments": "/api/payments",
    "notifications": "/api/notifications",
    "media": "/api/media"
  }
}
```

#### 3. Google OAuth Init
```http
GET /api/auth/google/init?redirectTo=<callback_url>
```
**Response:**
```json
{
  "authUrl": "https://accounts.google.com/oauth/authorize?..."
}
```

#### 4. Google OAuth Exchange
```http
POST /api/auth/google/exchange
Content-Type: application/json

{
  "code": "authorization_code_from_google"
}
```
**Response:**
```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "username": "username",
    "profile_pic": "https://...",
    "is_verified": false,
    "kyc_status": "pending"
  }
}
```

#### 5. Request OTP
```http
POST /api/auth/otp/request
Content-Type: application/json

{
  "phone": "+1234567890"
}
```
**Response:**
```json
{
  "message": "OTP sent successfully",
  "phone": "+1234567890"
}
```

#### 6. Verify OTP
```http
POST /api/auth/otp/verify
Content-Type: application/json

{
  "phone": "+1234567890",
  "code": "123456",
  "username": "newuser",
  "bio": "Hello, I'm new here!"
}
```
**Response:**
```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "user_uuid",
    "phone": "+1234567890",
    "username": "newuser",
    "bio": "Hello, I'm new here!",
    "profile_pic": "https://ui-avatars.com/api/?name=newuser&background=E30CBD&color=fff",
    "followers": 0,
    "following": 0,
    "total_likes": 0,
    "coins_earned": 0,
    "is_verified": false,
    "kyc_status": "pending"
  }
}
```

#### 7. Email Signup
```http
POST /api/auth/email/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "newuser",
  "bio": "Hello, I'm new here!"
}
```
**Response:** Same as OTP verify

#### 8. Email Login
```http
POST /api/auth/email/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:** Same as OTP verify

#### 9. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```
**Response:**
```json
{
  "accessToken": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token"
}
```

#### 10. Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### 👤 User Management

#### 1. Get Current User Profile
```http
GET /api/users/profile
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "phone": "+1234567890",
  "username": "username",
  "bio": "User bio",
  "profile_pic": "https://...",
  "followers": 150,
  "following": 75,
  "total_likes": 1250,
  "coins_earned": 5000,
  "is_verified": true,
  "kyc_status": "verified",
  "kyc_document_url": "https://...",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Get User by ID
```http
GET /api/users/{userId}
```
**Response:** Same as current user profile

#### 3. Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "updatedusername",
  "bio": "Updated bio text",
  "profile_pic": "https://example.com/new-profile.jpg"
}
```
**Response:** Updated user profile

#### 4. Search Users
```http
GET /api/users/search?q=username&page=1&limit=20
```
**Response:**
```json
{
  "users": [
    {
      "id": "user_uuid",
      "username": "username",
      "profile_pic": "https://...",
      "followers": 150,
      "is_verified": true,
      "kyc_status": "verified"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### 5. Follow User
```http
POST /api/users/{userId}/follow
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "Successfully followed user",
  "isFollowing": true
}
```

#### 6. Unfollow User
```http
DELETE /api/users/{userId}/follow
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "Successfully unfollowed user",
  "isFollowing": false
}
```

#### 7. Get User Followers
```http
GET /api/users/{userId}/followers?page=1&limit=20
```
**Response:**
```json
{
  "followers": [
    {
      "id": "follower_uuid",
      "username": "follower_username",
      "profile_pic": "https://...",
      "is_verified": false,
      "followed_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### 8. Get User Following
```http
GET /api/users/{userId}/following?page=1&limit=20
```
**Response:** Same structure as followers

#### 9. Check Can Message User
```http
GET /api/users/{userId}/can-message
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "canMessage": true,
  "reason": "User has sufficient coins (150 > 99)",
  "senderCoins": 150,
  "requiredCoins": 99
}
```

---

### 📊 User Analytics

#### 1. Get User Stream Duration (Weekly)
```http
GET /api/users/{userId}/stream-duration?period=weekly
```
**Response:**
```json
{
  "period": "weekly",
  "data": [
    {
      "date": "2024-01-01",
      "duration_minutes": 120,
      "streams_count": 3
    },
    {
      "date": "2024-01-02",
      "duration_minutes": 90,
      "streams_count": 2
    }
  ],
  "total_duration_minutes": 210,
  "total_streams": 5
}
```

#### 2. Get User Stream Duration (Monthly)
```http
GET /api/users/{userId}/stream-duration?period=monthly
```
**Response:** Same structure as weekly

#### 3. Get User Top Gifter
```http
GET /api/users/{userId}/top-gifter
```
**Response:**
```json
{
  "topGifter": {
    "id": "gifter_uuid",
    "username": "top_gifter",
    "profile_pic": "https://...",
    "total_coins_sent": 2500,
    "gifts_count": 15
  }
}
```

#### 4. Get User Top Gifts
```http
GET /api/users/{userId}/top-gifts?limit=4
```
**Response:**
```json
{
  "topGifts": [
    {
      "id": "gift_uuid",
      "name": "Diamond Ring",
      "icon_url": "https://...",
      "coin_value": 500,
      "received_count": 3,
      "total_coins": 1500
    },
    {
      "id": "gift_uuid_2",
      "name": "Rose",
      "icon_url": "https://...",
      "coin_value": 100,
      "received_count": 10,
      "total_coins": 1000
    }
  ]
}
```

---

### 📺 Streaming

#### 1. Create Stream
```http
POST /api/streaming
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "My Live Stream",
  "description": "Join me for an amazing live stream!",
  "thumbnail_url": "https://example.com/thumbnail.jpg"
}
```
**Response:**
```json
{
  "stream": {
    "id": "stream_uuid",
    "user_id": "user_uuid",
    "title": "My Live Stream",
    "description": "Join me for an amazing live stream!",
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "status": "created",
    "viewer_count": 0,
    "likes_count": 0,
    "coins_earned": 0,
    "started_at": null,
    "ended_at": null,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Get Live Streams
```http
GET /api/streaming/live?page=1&limit=20
```
**Response:**
```json
{
  "streams": [
    {
      "id": "stream_uuid",
      "user": {
        "id": "user_uuid",
        "username": "streamer_username",
        "profile_pic": "https://..."
      },
      "title": "Live Stream Title",
      "description": "Stream description",
      "thumbnail_url": "https://...",
      "status": "live",
      "viewer_count": 150,
      "likes_count": 25,
      "coins_earned": 500,
      "started_at": "2024-01-01T00:00:00.000Z",
      "duration_minutes": 30
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### 3. Get Stream by ID
```http
GET /api/streaming/{streamId}
```
**Response:** Stream details with user info

#### 4. Start Stream
```http
POST /api/streaming/{streamId}/start
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "Stream started successfully",
  "stream": {
    "id": "stream_uuid",
    "status": "live",
    "started_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 5. End Stream
```http
POST /api/streaming/{streamId}/end
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "Stream ended successfully",
  "stream": {
    "id": "stream_uuid",
    "status": "ended",
    "ended_at": "2024-01-01T00:00:00.000Z",
    "total_duration_minutes": 120,
    "final_stats": {
      "peak_viewers": 200,
      "total_likes": 50,
      "total_coins_earned": 1000
    }
  }
}
```

#### 6. Update Viewer Count
```http
PUT /api/streaming/{streamId}/viewers
Content-Type: application/json

{
  "count": 150
}
```
**Response:**
```json
{
  "message": "Viewer count updated",
  "viewer_count": 150
}
```

#### 7. Get User Streams
```http
GET /api/streaming/user/{userId}?page=1&limit=20
```
**Response:** List of user's streams with pagination

#### 8. Delete Stream
```http
DELETE /api/streaming/{streamId}
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "Stream deleted successfully"
}
```

---

### 💰 Payments & Gifts

#### 1. Get Available Gifts
```http
GET /api/payments/gifts
```
**Response:**
```json
{
  "gifts": [
    {
      "id": "gift_uuid",
      "name": "Rose",
      "description": "A beautiful rose",
      "icon_url": "https://...",
      "coin_value": 100,
      "category": "flowers"
    },
    {
      "id": "gift_uuid_2",
      "name": "Diamond Ring",
      "description": "Sparkling diamond ring",
      "icon_url": "https://...",
      "coin_value": 500,
      "category": "jewelry"
    }
  ]
}
```

#### 2. Purchase Coins
```http
POST /api/payments/purchase-coins
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 1000,
  "payment_method": "stripe"
}
```
**Response:**
```json
{
  "transaction": {
    "id": "transaction_uuid",
    "user_id": "user_uuid",
    "type": "purchase",
    "amount": 1000,
    "payment_method": "stripe",
    "status": "completed",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "user_coins": 1500
}
```

#### 3. Send Gift
```http
POST /api/payments/send-gift
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "stream_id": "stream_uuid",
  "gift_id": "gift_uuid"
}
```
**Response:**
```json
{
  "gift": {
    "id": "gift_sent_uuid",
    "sender_id": "sender_uuid",
    "receiver_id": "receiver_uuid",
    "stream_id": "stream_uuid",
    "gift_id": "gift_uuid",
    "coin_value": 100,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "sender_coins_remaining": 900,
  "receiver_coins_earned": 100
}
```

#### 4. Get User Transactions
```http
GET /api/payments/transactions?page=1&limit=20
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "transactions": [
    {
      "id": "transaction_uuid",
      "type": "purchase",
      "amount": 1000,
      "payment_method": "stripe",
      "status": "completed",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "gift_uuid",
      "type": "gift_sent",
      "amount": -100,
      "gift_name": "Rose",
      "receiver_username": "receiver_username",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### 5. Get User Earnings
```http
GET /api/payments/earnings
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "total_earnings": 5000,
  "this_month": 1500,
  "this_week": 500,
  "today": 100,
  "withdrawable_amount": 4000,
  "pending_amount": 1000
}
```

#### 6. Request Withdrawal
```http
POST /api/payments/withdraw
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 500,
  "withdrawal_method": "bank",
  "account_details": {
    "account_number": "1234567890",
    "routing_number": "021000021",
    "account_type": "checking"
  }
}
```
**Response:**
```json
{
  "withdrawal": {
    "id": "withdrawal_uuid",
    "user_id": "user_uuid",
    "amount": 500,
    "withdrawal_method": "bank",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 📱 Notifications

#### 1. Get Notifications
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "notifications": [
    {
      "id": "notification_uuid",
      "user_id": "user_uuid",
      "type": "new_follower",
      "title": "New Follower",
      "message": "username started following you",
      "data": {
        "follower_id": "follower_uuid",
        "follower_username": "follower_username"
      },
      "is_read": false,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "pages": 2
  }
}
```

#### 2. Mark Notification as Read
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "Notification marked as read"
}
```

#### 3. Mark All Notifications as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "All notifications marked as read",
  "updated_count": 15
}
```

#### 4. Delete Notification
```http
DELETE /api/notifications/{notificationId}
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

#### 5. Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "unread_count": 15
}
```

---

### 📁 Media Management

#### 1. Generate Upload URL
```http
POST /api/media/upload-url
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fileName": "profile.jpg",
  "fileType": "image/jpeg"
}
```
**Response:**
```json
{
  "uploadUrl": "https://your-r2-bucket.r2.dev/presigned-url",
  "publicUrl": "https://your-cdn-domain.com/filename.jpg",
  "fileName": "user-uuid-filename.jpg",
  "expiresIn": 3600
}
```

#### 2. Upload Profile Picture
```http
POST /api/media/profile-picture
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Form Data:
- image: [file]
```
**Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "profile_pic": "https://your-cdn-domain.com/profile-picture.jpg"
}
```

#### 3. Get User Files
```http
GET /api/media/my-files?page=1&limit=20&type=image
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "files": [
    {
      "id": "file_uuid",
      "name": "profile.jpg",
      "url": "https://your-cdn-domain.com/file.jpg",
      "type": "image/jpeg",
      "size": 1024000,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

#### 4. Delete File
```http
DELETE /api/media/{fileId}
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "message": "File deleted successfully"
}
```

#### 5. Get File by ID
```http
GET /api/media/{fileId}
```
**Response:** File information

---

## ❌ Error Codes

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

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

## 🚦 Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **API endpoints**: 100 requests per minute per user
- **File uploads**: 10 requests per minute per user

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🧪 Testing Guide

### 1. Import Postman Collection
1. Download `LIVE_STREAMING_API_POSTMAN_COLLECTION.json`
2. Import into Postman
3. Set environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `accessToken`: (auto-filled after login)
   - `refreshToken`: (auto-filled after login)
   - `userId`: (auto-filled after login)
   - `streamId`: (auto-filled after stream creation)

### 2. Testing Flow
1. **Health Check**: Verify API is running
2. **Authentication**: Use any auth method (Google OAuth, Email, Phone)
3. **User Profile**: Test profile management
4. **Streaming**: Create and manage streams
5. **Payments**: Test coin purchases and gifts
6. **Analytics**: Check user statistics

### 3. Example Test Sequence
```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Create user (OTP)
curl -X POST http://localhost:3000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# 3. Verify OTP and get tokens
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456", "username": "testuser"}'

# 4. Use token for authenticated requests
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Database Setup
Before testing, ensure your Supabase database is set up:
1. Copy contents of `database/schema.sql`
2. Run in Supabase SQL Editor
3. Configure environment variables in `backend/.env`

### 5. Environment Variables
Required in `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 🔧 Development Notes

### Features Implemented ✅
- Complete user profile system with KYC
- Real-time streaming management
- Virtual economy with coins and gifts
- Social features (follow/unfollow)
- Message permission system (99 coin threshold)
- User analytics and statistics
- Media upload system
- Notification system

### Pending Features 🚧
- Cloudflare R2 integration (presigned URLs)
- Real-time WebSocket connections
- Advanced payment processing
- Image compression and optimization
- Push notifications

### Security Features 🔒
- JWT-based authentication
- Row Level Security (RLS) in Supabase
- Input validation and sanitization
- Rate limiting
- HTTPS enforcement
- Secure file uploads

---

## 📞 Support

For API support and questions:
- **Documentation**: This file
- **Postman Collection**: `LIVE_STREAMING_API_POSTMAN_COLLECTION.json`
- **Database Schema**: `database/schema.sql`
- **Implementation Guide**: `USER_PROFILE_IMPLEMENTATION.md`
