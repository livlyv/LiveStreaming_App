# Live Streaming App - Supabase Integration

This project integrates Supabase for authentication and database management in a React Native live streaming application.

## Setup Instructions

### 1. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Database Setup**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Run the SQL to create all tables and functions

3. **Authentication Setup**
   - In Supabase dashboard, go to Authentication > Settings
   - Configure your authentication providers:
     - **Email**: Enable email authentication
     - **Phone**: Enable phone authentication (requires SMS provider)
     - **Google**: Add Google OAuth credentials
     - **Facebook**: Add Facebook OAuth credentials
     - **Apple**: Add Apple OAuth credentials (iOS only)

### 2. Environment Variables

1. **Copy the .env file and fill in your credentials:**

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration (use a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here

# App Configuration
APP_ENV=development
BASE_URL=http://localhost:3000

# OTP Configuration (for SMS provider like MSG91, Twilio, etc.)
OTP_PROVIDER_API_KEY=your-otp-provider-key-here
OTP_PROVIDER_SENDER_ID=your-sender-id-here

# Google OAuth (for social login)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### 3. Frontend Configuration

Add these environment variables to your Expo app:

```bash
# In your .env file or Expo environment
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Authentication Features

The app now supports:

#### Phone Authentication
- Send OTP to phone number
- Verify OTP for login/signup
- Automatic user creation on first signup

#### Email Authentication
- Email/password signup with email verification
- Email/password login
- Password reset (handled by Supabase)

#### Social Authentication
- Google OAuth (requires proper setup)
- Facebook OAuth (requires proper setup)
- Apple OAuth (iOS only, requires proper setup)

### 5. API Endpoints

The backend provides these authentication endpoints:

- `POST /api/auth/otp/request` - Request OTP for phone
- `POST /api/auth/otp/verify` - Verify OTP and login/signup
- `POST /api/auth/signup` - Email signup
- `POST /api/auth/login` - Email login
- `POST /api/auth/social` - Social authentication
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### 6. Database Schema

The database includes these main tables:

- **users** - User profiles and metadata
- **auth_sessions** - JWT token management
- **streams** - Live stream information
- **stream_viewers** - Track stream viewers
- **followers** - User follow relationships
- **stream_likes** - Stream likes
- **gifts** - Available gifts
- **stream_gifts** - Gifts sent during streams
- **chat_messages** - Stream chat messages
- **user_coins** - Coin transaction history
- **notifications** - User notifications
- **reports** - Content moderation reports

### 7. Security Features

- **JWT Authentication** - Secure token-based authentication
- **Row Level Security (RLS)** - Database-level security policies
- **Password Hashing** - Handled by Supabase Auth
- **Token Refresh** - Automatic token refresh mechanism
- **Input Validation** - Server-side validation for all inputs

### 8. Development vs Production

#### Development
- Mock OTP codes are shown in alerts
- Social login uses demo tokens
- Detailed error messages

#### Production
- Real SMS integration required for OTP
- Proper OAuth setup required for social login
- Error messages are user-friendly
- All secrets must be properly configured

### 9. Next Steps

1. **SMS Provider Integration**
   - Integrate with MSG91, Twilio, or similar for OTP delivery
   - Update the `sendOTP` function in `backend/routes/auth.ts`

2. **Social OAuth Setup**
   - Configure Google OAuth in Google Console
   - Configure Facebook OAuth in Facebook Developers
   - Configure Apple OAuth in Apple Developer Console
   - Update the social auth verification logic

3. **Email Templates**
   - Customize Supabase email templates
   - Add your branding and styling

4. **Push Notifications**
   - Integrate with OneSignal or Firebase for push notifications
   - Set up notification triggers

5. **Content Moderation**
   - Implement automated content moderation
   - Set up admin dashboard for reports

### 10. Testing

Use these test credentials in development:

- **Phone**: Any 10-digit number
- **OTP**: Check the alert for the mock code
- **Email**: Any valid email format
- **Password**: Minimum 6 characters

### 11. Troubleshooting

Common issues and solutions:

1. **Supabase Connection Issues**
   - Verify your SUPABASE_URL and keys
   - Check if your IP is whitelisted (if applicable)

2. **JWT Token Issues**
   - Ensure JWT_SECRET is set and consistent
   - Check token expiration times

3. **Database Errors**
   - Verify the schema was created correctly
   - Check RLS policies if data access issues occur

4. **OTP Not Working**
   - In development, check the alert for mock codes
   - In production, verify SMS provider configuration

For more help, check the Supabase documentation or create an issue in the repository.