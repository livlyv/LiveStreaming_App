# Google OAuth Backend Implementation

This document explains the backend implementation for Google OAuth using Supabase Auth integration.

## 🏗️ **Architecture Overview**

The backend provides a complete Google OAuth flow that:
1. **Integrates with Supabase Auth** for OAuth handling
2. **Manages user data** in your custom database
3. **Generates JWT tokens** for your backend API
4. **Handles mobile OAuth flows** with proper redirects

## 📋 **Backend Endpoints**

### **1. OAuth Initiation**
```
GET /api/auth/google/init
```

**Purpose**: Generates the OAuth URL for Google authentication

**Query Parameters**:
- `redirectTo` (optional): Custom redirect URL

**Response**:
```json
{
  "success": true,
  "oauthUrl": "https://your-project.supabase.co/auth/v1/authorize?provider=google&redirect_to=...",
  "message": "Google OAuth URL generated successfully"
}
```

### **2. Token Exchange**
```
POST /api/auth/google/exchange
```

**Purpose**: Exchanges authorization code for tokens and user data

**Request Body**:
```json
{
  "code": "authorization_code_from_oauth"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Google OAuth token exchange successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "profile_pic": "https://...",
    "bio": "User bio",
    "is_verified": true,
    "followers": 0,
    "following": 0,
    "total_likes": 0,
    "coins_earned": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "tokens": {
    "accessToken": "jwt_token_for_backend",
    "refreshToken": "refresh_token",
    "expiresIn": 3600
  },
  "supabaseSession": {
    "accessToken": "supabase_access_token",
    "refreshToken": "supabase_refresh_token",
    "expiresAt": 1234567890
  }
}
```

### **3. User Profile**
```
GET /api/auth/google/profile
```

**Purpose**: Retrieves user profile using Supabase token

**Headers**:
```
Authorization: Bearer supabase_access_token
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "profile_pic": "https://...",
    "bio": "User bio",
    "is_verified": true,
    "followers": 0,
    "following": 0,
    "total_likes": 0,
    "coins_earned": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### **4. OAuth Callback (Legacy)**
```
POST /api/auth/google/callback
```

**Purpose**: Handles OAuth callback with access token (legacy approach)

**Request Body**:
```json
{
  "accessToken": "supabase_access_token",
  "refreshToken": "supabase_refresh_token"
}
```

## 🔄 **OAuth Flow Process**

### **Mobile App Flow**:

1. **App calls** `/api/auth/google/init`
2. **Backend returns** Supabase OAuth URL
3. **App opens** OAuth URL in WebBrowser
4. **User authenticates** with Google
5. **Google redirects** to `https://auth.expo.io/@rahul_1996_s/rork-app`
6. **Expo Auth Proxy** sends result back to app
7. **App extracts** authorization code from URL
8. **App calls** `/api/auth/google/exchange` with code
9. **Backend exchanges** code for Supabase session
10. **Backend creates/updates** user in database
11. **Backend returns** user data + JWT tokens
12. **App stores** tokens and navigates to main screen

### **Web App Flow**:

1. **Web app calls** `/api/auth/google/init`
2. **Backend returns** OAuth URL
3. **Web app redirects** to OAuth URL
4. **User authenticates** with Google
5. **Google redirects** to your callback URL
6. **Backend handles** callback and processes user
7. **Backend redirects** to success page with tokens

## 🗄️ **Database Integration**

### **User Creation Process**:

1. **Check if user exists** in `users` table by Supabase ID
2. **If exists**: Return existing user data
3. **If new user**: Create new user with:
   - `id`: Supabase user ID
   - `email`: From Supabase user data
   - `username`: From Google profile or email
   - `profile_pic`: From Google profile picture
   - `bio`: Default welcome message
   - `is_verified`: Based on email confirmation
   - Default values for followers, likes, etc.

### **User Data Mapping**:

```javascript
const userData = {
  id: supabaseUser.id,
  email: supabaseUser.email,
  username: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
  bio: `Hi, I'm ${supabaseUser.user_metadata?.full_name || 'new here'}!`,
  profile_pic: supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${supabaseUser.user_metadata?.full_name || 'User'}&background=E30CBD&color=fff`,
  followers: 0,
  following: 0,
  total_likes: 0,
  coins_earned: 0,
  is_verified: supabaseUser.email_confirmed_at ? true : false,
  phone: null
};
```

## 🔐 **Security Features**

### **Token Management**:
- **Supabase tokens**: For Supabase Auth operations
- **JWT tokens**: For your backend API authentication
- **Token validation**: All endpoints validate tokens
- **Error handling**: Comprehensive error responses

### **CORS Configuration**:
- **Mobile apps**: Allow all origins for mobile development
- **Web apps**: Configured for specific domains
- **Ngrok support**: Automatically allows ngrok URLs

### **Rate Limiting**:
- **API endpoints**: 100 requests per 15 minutes per IP
- **OAuth endpoints**: Same rate limiting applied

## 🚀 **Environment Variables**

Required environment variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 📱 **Frontend Integration**

### **Mobile App Usage**:

```typescript
// 1. Initiate OAuth
const initResponse = await fetch(`${BASE_URL}/api/auth/google/init`);
const { oauthUrl } = await initResponse.json();

// 2. Open OAuth URL
const result = await WebBrowser.openAuthSessionAsync(
  oauthUrl, 
  'https://auth.expo.io/@rahul_1996_s/rork-app'
);

// 3. Extract code and exchange
if (result.type === 'success') {
  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  
  const exchangeResponse = await fetch(`${BASE_URL}/api/auth/google/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  const data = await exchangeResponse.json();
  // Store tokens and user data
}
```

### **Web App Usage**:

```javascript
// 1. Redirect to OAuth
const initResponse = await fetch('/api/auth/google/init');
const { oauthUrl } = await initResponse.json();
window.location.href = oauthUrl;

// 2. Handle callback (on callback page)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  const response = await fetch('/api/auth/google/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  const data = await response.json();
  // Store tokens and redirect to main app
}
```

## 🔍 **Error Handling**

### **Common Error Responses**:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### **Error Types**:
- **400**: Bad Request (missing parameters)
- **401**: Unauthorized (invalid tokens)
- **404**: Not Found (user not found)
- **500**: Internal Server Error (server issues)

## 🧪 **Testing**

### **Test OAuth Flow**:

1. **Start backend**: `npm run start:backend`
2. **Start frontend**: `npm run dev`
3. **Test mobile flow**: Use Expo Go app
4. **Test web flow**: Open in browser
5. **Check logs**: Monitor backend console for detailed logs

### **Test Endpoints**:

```bash
# Health check
curl http://localhost:3000/health

# OAuth initiation
curl http://localhost:3000/api/auth/google/init

# Token exchange (requires valid code)
curl -X POST http://localhost:3000/api/auth/google/exchange \
  -H "Content-Type: application/json" \
  -d '{"code":"your_auth_code"}'
```

## 🔧 **Configuration**

### **Supabase Auth Settings**:
- **Site URL**: `https://your-project.supabase.co`
- **Redirect URLs**: `https://auth.expo.io/@rahul_1996_s/rork-app`

### **Google Cloud Console**:
- **Redirect URIs**: `https://auth.expo.io/@rahul_1996_s/rork-app`

## 📝 **Logging**

The backend provides comprehensive logging:

```
🔐 Google OAuth initiation requested
🔗 Redirecting to Supabase OAuth: https://...
🔄 Google OAuth token exchange requested
🔍 Exchanging authorization code for session...
✅ Token exchange successful for user: user@example.com
✅ Google OAuth token exchange successful for user: user@example.com
```

## 🚨 **Troubleshooting**

### **Common Issues**:

1. **"Invalid access token"**: Token expired or invalid
2. **"User not found"**: User not created in database
3. **"OAuth flow failed"**: Google OAuth configuration issue
4. **"Token exchange failed"**: Supabase configuration issue

### **Debug Steps**:

1. **Check environment variables** are set correctly
2. **Verify Supabase configuration** in dashboard
3. **Check Google Cloud Console** redirect URIs
4. **Monitor backend logs** for detailed error messages
5. **Test with Postman** to isolate frontend/backend issues
