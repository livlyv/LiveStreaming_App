const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
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