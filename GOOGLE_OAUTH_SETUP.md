# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for the Rork app using Supabase Auth with Expo AuthSession.

## 🔧 **Current Setup**

We're using **Supabase Auth** as the OAuth provider with **Expo AuthSession** for proper mobile OAuth handling:

### **Redirect URI Strategy**
- **Mobile**: Dynamically generated using `AuthSession.makeRedirectUri()`
- **Web**: `http://localhost:8081` (for development)

## 📋 **Configuration Steps**

### **Step 1: Google Cloud Console Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Choose **Mobile application** for the application type
6. Add the following **Authorized redirect URIs**:
   ```
   https://auth.expo.io/@rahul_1996_s/rork-app
   ```
7. Copy the **Client ID** and add it to your environment variables

### **Step 2: Supabase Auth Configuration**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Enable **Google** provider
5. Add your Google **Client ID** and **Client Secret**
6. In **Authentication** > **Settings**:
   - **Site URL**: `https://ee9471b7b134.ngrok-free.app` (your current ngrok URL)
   - **Redirect URLs**: Add `https://auth.expo.io/@rahul_1996_s/rork-app`

### **Step 3: Environment Variables**

Add these to your `.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
SUPABASE_URL=https://rpitkhbryvrppszpwjtj.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_API_BASE_URL=https://ee9471b7b134.ngrok-free.app
```

## 🔄 **How It Works (Updated)**

1. **User taps "Continue with Google"**
2. **App generates** redirect URI using `AuthSession.makeRedirectUri()`
3. **App calls** `supabase.auth.signInWithOAuth()` with dynamic redirect URI
4. **Supabase redirects** to Google OAuth
5. **User authenticates** with Google
6. **Google redirects** to Expo Auth Proxy with authorization code
7. **Expo Auth Proxy** sends result back to app via deep link
8. **App extracts** authorization code from URL
9. **App calls** backend `/api/auth/google/exchange` with the code
10. **Backend exchanges** code for tokens and creates/updates user
11. **User is signed in** and redirected to the main app

## 🚨 **Important Notes**

- **Dynamic redirect URI**: Uses `AuthSession.makeRedirectUri()` instead of hardcoded URL
- **Expo Auth Proxy**: Automatically handles the OAuth callback
- **Deep linking**: App receives the OAuth result via deep link
- **Backend integration**: Still uses your backend for token exchange and user creation

## 🔍 **Troubleshooting**

### **Error: redirect_uri_mismatch**
- Ensure Google Cloud Console has `https://auth.expo.io/@rahul_1996_s/rork-app`
- Check that Supabase Auth settings match

### **Error: "something went wrong trying to finish signing in"**
- Verify that `AuthSession.makeRedirectUri()` is generating the correct URL
- Check that deep linking is properly configured in the app

### **OAuth flow being dismissed**
- Make sure you're using the correct Google Client ID
- Verify that Google OAuth is enabled in Supabase Auth settings

### **No redirect to app after OAuth**
- Check that the app has proper deep link handling
- Verify that `WebBrowser.openAuthSessionAsync()` is using the correct redirect URI

## 📱 **Testing**

1. Start your development server: `npm run dev`
2. Open the app in Expo Go
3. Tap "Continue with Google"
4. Complete the Google OAuth flow
5. You should be redirected back to the app and signed in

## 🔒 **Security**

- All OAuth communication uses HTTPS
- Tokens are stored securely by Supabase
- No sensitive data is exposed in the frontend
- Authentication state is managed by Supabase Auth
