import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_CLIENT_ID, BASE_URL } from '@/lib/config';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Scopes
const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email'
];

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export interface GoogleAuthResponse {
  accessToken: string;
  idToken: string;
  user: GoogleUser;
}

class GoogleAuthService {
  async signIn(): Promise<GoogleAuthResponse> {
    try {
      console.log('🔐 Starting Google OAuth...');
      console.log('🔧 Platform:', Platform.OS);
      console.log('🔧 Google Client ID:', GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
      console.log('🔧 Backend URL:', BASE_URL);

      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID not found');
      }

      if (Platform.OS !== 'web') {
        return this.handleMobileOAuth();
      }

      throw new Error('Web OAuth requires browser redirect');

    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      throw error;
    }
  }

  private async handleMobileOAuth(): Promise<GoogleAuthResponse> {
    try {
      console.log('📱 Handling mobile OAuth flow...');

      // Use Supabase's default redirect since Google Cloud Console is fixed
      const redirectUri = 'https://auth.expo.io/@rahul_1996_s/rork-app';

      console.log('🔗 Using Expo Auth Proxy URL:', redirectUri);

      // Use Supabase's signInWithOAuth with Expo Auth Proxy
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('❌ Supabase OAuth error:', error);
        throw new Error(`OAuth failed: ${error.message}`);
      }

      if (!data.url) {
        throw new Error('No OAuth URL returned from Supabase');
      }

      console.log('✅ OAuth initiated successfully');
      console.log('🔗 Auth URL:', data.url);

      // Open the OAuth URL in browser
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      console.log('📱 WebBrowser result:', result);
      console.log('📱 Result type:', result.type);
      if ('url' in result) {
        console.log('📱 Result URL:', result.url);
      }

      if (result.type === 'success' && result.url) {
        console.log('✅ OAuth completed successfully');
        
        // Extract authorization code from URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        
        console.log('🔍 URL search params:', Object.fromEntries(url.searchParams.entries()));
        
        if (!code) {
          console.error('❌ No authorization code found in URL');
          console.error('❌ URL params:', Object.fromEntries(url.searchParams.entries()));
          throw new Error('No authorization code received from OAuth flow');
        }

        console.log('🔑 Authorization code received:', code.substring(0, 20) + '...');
        console.log('🔍 State parameter:', state ? 'Present' : 'Missing');

        // Exchange code for tokens via backend
        console.log('🔄 Exchanging code for tokens...');
        const exchangeResponse = await fetch(`${BASE_URL}/api/auth/google/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        console.log('📡 Exchange response status:', exchangeResponse.status);
        console.log('📡 Exchange response ok:', exchangeResponse.ok);

        if (!exchangeResponse.ok) {
          const errorData = await exchangeResponse.json();
          console.error('❌ Exchange error data:', errorData);
          throw new Error(`Token exchange failed: ${errorData.message || errorData.error || 'Unknown error'}`);
        }

        const exchangeData = await exchangeResponse.json();
        console.log('✅ Token exchange successful');
        console.log('👤 User data:', exchangeData.user);

        return {
          accessToken: exchangeData.tokens.accessToken,
          idToken: exchangeData.supabaseSession.accessToken,
          user: {
            id: exchangeData.user.id,
            email: exchangeData.user.email,
            name: exchangeData.user.username,
            picture: exchangeData.user.profile_pic,
            verified_email: exchangeData.user.is_verified
          }
        };

      } else if (result.type === 'cancel') {
        console.log('❌ OAuth flow was cancelled by user');
        throw new Error('OAuth flow was cancelled by user');
      } else {
        console.error('❌ OAuth flow failed with type:', result.type);
        throw new Error(`OAuth flow failed with type: ${result.type}`);
      }

    } catch (error) {
      console.error('❌ Mobile OAuth error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Get user error:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
