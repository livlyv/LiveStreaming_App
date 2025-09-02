const API_BASE_URL = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ? `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL}/api` : 'http://localhost:3000/api';

console.log('🔧 Auth Service Configuration:');
console.log('🔧 EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
console.log('🔧 Final API_BASE_URL:', API_BASE_URL);

export interface User {
  id: string;
  email?: string;
  phone?: string;
  username: string;
  bio?: string;
  profile_pic?: string;
  followers: number;
  following: number;
  total_likes: number;
  coins_earned: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}

export interface ApiError {
  error: string;
}

class AuthService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 Making request to:', url);
    console.log('📤 Request options:', JSON.stringify(options, null, 2));
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });
      
      clearTimeout(timeoutId);

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log('📥 Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text}`);
      }
      
      console.log('📥 Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Network request failed:', error);
      console.error('❌ URL was:', url);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your internet connection');
        }
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          throw new Error('Network error - please check if the server is running and accessible');
        }
      }
      
      throw error;
    }
  }

  async requestOTP(phone: string): Promise<{ success: boolean; phone: string; message: string; mockCode?: string }> {
    return this.makeRequest('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOTP(phone: string, code: string, username?: string, bio?: string): Promise<AuthResponse> {
    return this.makeRequest('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, username, bio }),
    });
  }

  async signup(email: string, password: string, username: string, bio?: string): Promise<{
    success: boolean;
    message: string;
    user: User;
    needsEmailVerification: boolean;
  }> {
    return this.makeRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, bio }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async socialAuth(provider: 'google' | 'facebook' | 'apple', token: string): Promise<AuthResponse> {
    return this.makeRequest('/auth/social', {
      method: 'POST',
      body: JSON.stringify({ provider, token }),
    });
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: User;
  }> {
    return this.makeRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(accessToken: string): Promise<{ user: User }> {
    return this.makeRequest('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}

export const authService = new AuthService();