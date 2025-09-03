# Environment Variables Setup

## 🚨 **Required: Create .env file**

You need to create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (REQUIRED)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app

# Backend Environment Variables
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
EXPO_PUBLIC_JWT_SECRET=your_jwt_secret

# Other Configuration
APP_ENV=development
BASE_URL=https://your-ngrok-url.ngrok-free.app
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

## 🔧 **How to get these values:**

### 1. **Supabase Credentials**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 2. **Google OAuth Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Copy your **OAuth 2.0 Client ID** → `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

### 3. **Ngrok URL**
1. Start ngrok: `ngrok http 3000`
2. Copy the HTTPS URL → `EXPO_PUBLIC_API_BASE_URL`

## 🚀 **Quick Setup Steps:**

1. **Create `.env` file** in project root
2. **Add your Supabase credentials** (most important)
3. **Add your Google Client ID**
4. **Restart your development server**

## 🔍 **Troubleshooting:**

- **"Supabase URL missing"**: Add `EXPO_PUBLIC_SUPABASE_URL` to `.env`
- **"Google Client ID missing"**: Add `EXPO_PUBLIC_GOOGLE_CLIENT_ID` to `.env`
- **App not loading**: Restart with `npm run start`

## 📝 **Example .env file:**

```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
EXPO_PUBLIC_API_BASE_URL=https://abc123.ngrok-free.app
```

**Create this file now and restart your app!** 🚀
