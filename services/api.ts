import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/lib/config';

// Types
export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
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
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface Stream {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  stream_key: string;
  is_live: boolean;
  viewer_count: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  users?: User;
}

export interface Gift {
  id: string;
  name: string;
  icon_url: string;
  price: number;
  animation_url?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'gift' | 'withdrawal' | 'earning';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  reference_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'follow' | 'gift' | 'like' | 'comment' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('accessToken', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  private async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('refreshToken', token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the request with new token
            const newToken = await this.getAuthToken();
            if (newToken) {
              headers.Authorization = `Bearer ${newToken}`;
              const retryResponse = await fetch(url, { ...config, headers });
              if (retryResponse.ok) {
                return await retryResponse.json();
              }
            }
          }
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.setAuthToken(data.accessToken);
        await this.setRefreshToken(data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Authentication Methods
  async requestOTP(phone: string): Promise<{ message: string; expires: string }> {
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOTP(phone: string, code: string, username?: string, bio?: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, username, bio }),
    });

    await this.setAuthToken(response.accessToken);
    await this.setRefreshToken(response.refreshToken);
    return response;
  }

  async emailSignup(email: string, password: string, username: string, bio?: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, bio }),
    });

    await this.setAuthToken(response.accessToken);
    await this.setRefreshToken(response.refreshToken);
    return response;
  }

  async emailLogin(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await this.setAuthToken(response.accessToken);
    await this.setRefreshToken(response.refreshToken);
    return response;
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });

    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    return response;
  }

  // User Methods
  async getUserProfile(): Promise<{ user: User }> {
    return this.request('/users/profile');
  }

  async getUserById(userId: string): Promise<{ user: User }> {
    return this.request(`/users/${userId}`);
  }

  async updateProfile(data: { username?: string; bio?: string; profile_pic?: string }): Promise<{ message: string; user: User }> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async followUser(userId: string): Promise<{ message: string }> {
    return this.request(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<{ message: string }> {
    return this.request(`/users/${userId}/follow`, {
      method: 'DELETE',
    });
  }

  async getUserFollowers(userId: string, page = 1, limit = 20): Promise<{ followers: User[]; page: number; limit: number }> {
    return this.request(`/users/${userId}/followers?page=${page}&limit=${limit}`);
  }

  async getUserFollowing(userId: string, page = 1, limit = 20): Promise<{ following: User[]; page: number; limit: number }> {
    return this.request(`/users/${userId}/following?page=${page}&limit=${limit}`);
  }

  async searchUsers(query: string, page = 1, limit = 20): Promise<{ users: User[]; page: number; limit: number }> {
    return this.request(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  // Streaming Methods
  async createStream(data: { title: string; description?: string; thumbnail_url?: string }): Promise<{ message: string; stream: Stream }> {
    return this.request('/streaming', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLiveStreams(page = 1, limit = 20): Promise<{ streams: Stream[]; page: number; limit: number }> {
    return this.request(`/streaming/live?page=${page}&limit=${limit}`);
  }

  async getStreamById(streamId: string): Promise<{ stream: Stream }> {
    return this.request(`/streaming/${streamId}`);
  }

  async startStream(streamId: string): Promise<{ message: string }> {
    return this.request(`/streaming/${streamId}/start`, {
      method: 'POST',
    });
  }

  async endStream(streamId: string): Promise<{ message: string }> {
    return this.request(`/streaming/${streamId}/end`, {
      method: 'POST',
    });
  }

  async getUserStreams(userId: string, page = 1, limit = 20): Promise<{ streams: Stream[]; page: number; limit: number }> {
    return this.request(`/streaming/user/${userId}?page=${page}&limit=${limit}`);
  }

  async deleteStream(streamId: string): Promise<{ message: string }> {
    return this.request(`/streaming/${streamId}`, {
      method: 'DELETE',
    });
  }

  // Payment Methods
  async getGifts(): Promise<{ gifts: Gift[] }> {
    return this.request('/payments/gifts');
  }

  async purchaseCoins(amount: number, paymentMethod: string): Promise<{ message: string; transaction: Transaction }> {
    return this.request('/payments/purchase-coins', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod }),
    });
  }

  async sendGift(streamId: string, giftId: string): Promise<{ message: string; gift: Gift; transaction: Transaction }> {
    return this.request('/payments/send-gift', {
      method: 'POST',
      body: JSON.stringify({ stream_id: streamId, gift_id: giftId }),
    });
  }

  async getTransactions(page = 1, limit = 20): Promise<{ transactions: Transaction[]; page: number; limit: number }> {
    return this.request(`/payments/transactions?page=${page}&limit=${limit}`);
  }

  async getEarnings(): Promise<{ coins_earned: number; total_earnings: number }> {
    return this.request('/payments/earnings');
  }

  async requestWithdrawal(amount: number, withdrawalMethod: string, accountDetails: any): Promise<{ message: string; transaction: Transaction }> {
    return this.request('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, withdrawal_method: withdrawalMethod, account_details: accountDetails }),
    });
  }

  // Notification Methods
  async getNotifications(page = 1, limit = 20): Promise<{ notifications: Notification[]; page: number; limit: number }> {
    return this.request(`/notifications?page=${page}&limit=${limit}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<{ message: string }> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request('/notifications/unread-count');
  }

  // Media Methods
  async uploadFile(file: File): Promise<{ message: string; file: any }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  }

  async getMyFiles(page = 1, limit = 20, type?: string): Promise<{ files: any[]; page: number; limit: number }> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (type) params.append('type', type);
    return this.request(`/media/my-files?${params}`);
  }

  async deleteFile(fileId: string): Promise<{ message: string }> {
    return this.request(`/media/${fileId}`, {
      method: 'DELETE',
    });
  }

  async getFileById(fileId: string): Promise<{ file: any }> {
    return this.request(`/media/${fileId}`);
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return fetch(`${this.baseURL.replace('/api', '')}/health`).then(res => res.json());
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);


