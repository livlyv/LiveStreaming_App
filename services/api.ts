import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/lib/config';
import { logger } from '@/lib/logger';

// Types
export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  bio?: string;
  profile_pic?: string;
  followers_count: number;
  following_count: number;
  total_likes: number;
  coins_earned: number;
  is_verified: boolean;
  kyc_status: 'pending' | 'verified' | 'rejected';
  kyc_completed_at?: string;
  first_withdrawal_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  gift_notifications: boolean;
  live_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedUser {
  id: string;
  username: string;
  profile_pic?: string;
  reason?: string;
  blocked_at: string;
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
  icon: string;
  coins_cost: number;
  description?: string;
  is_active: boolean;
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

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  withdrawal_method: string;
  account_details: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cashfree_payout_id?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
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

export interface StreamDurationData {
  day_name?: string;
  day_date?: string;
  week_start?: string;
  week_end?: string;
  total_hours: number;
}

export interface TopGifter {
  sender_id: string;
  sender_username: string;
  sender_profile_pic: string;
  total_coins_sent: number;
}

export interface TopGift {
  gift_id: string;
  gift_name: string;
  gift_icon: string;
  gift_value: number;
  total_quantity: number;
  total_coins: number;
}

export interface EarningsData {
  coins_earned: number;
  total_earnings: number;
  total_gifts: number;
  withdrawal_threshold: number;
  can_withdraw: boolean;
  kyc_required: boolean;
  kyc_status: 'pending' | 'verified' | 'rejected';
  first_withdrawal_completed: boolean;
}

export interface KYCData {
  document_type: string;
  document_number: string;
  full_name: string;
  date_of_birth: string;
}

export interface SupportComplaint {
  id: string;
  user_id: string;
  topic: string;
  subject: string;
  description: string;
  email?: string;
  phone?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    logger.info('API', 'API Client initialized', { baseURL: this.baseURL });
  }

  // Get token from AuthProvider's storage
  private async getAuthToken(): Promise<string | null> {
    try {
      const tokenData = await AsyncStorage.getItem('auth_tokens');
      if (tokenData) {
        const tokens = JSON.parse(tokenData);
        logger.debug('AUTH', 'Retrieved auth token', { 
          hasToken: !!tokens.accessToken,
          tokenLength: tokens.accessToken?.length,
          expiresAt: tokens.expiresAt,
          isExpired: Date.now() > tokens.expiresAt
        });
        return tokens.accessToken;
      }
      logger.warn('AUTH', 'No auth tokens found in storage');
      return null;
    } catch (error) {
      logger.error('AUTH', 'Error retrieving auth token', null, error);
      return null;
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
      logger.debug('API', 'Request with auth token', { 
        endpoint, 
        method: options.method || 'GET',
        hasAuth: true 
      });
    } else {
      logger.warn('API', 'Request without auth token', { 
        endpoint, 
        method: options.method || 'GET' 
      });
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const requestId = Math.random().toString(36).substr(2, 9);
    logger.info('API', 'Making API request', { 
      requestId,
      url, 
      method: config.method || 'GET',
      hasAuth: !!token,
      endpoint 
    });

    try {
      const response = await fetch(url, config);
      
      logger.info('API', 'API response received', { 
        requestId,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        
        logger.error('API', 'API request failed', { 
          requestId,
          endpoint,
          status: response.status,
          statusText: response.statusText,
          errorData 
        }, error);
        
        throw error;
      }

      const data = await response.json();
      logger.info('API', 'API request successful', { 
        requestId,
        endpoint,
        dataKeys: Object.keys(data)
      });

      return data;
    } catch (error) {
      logger.error('API', 'API request failed', { 
        requestId,
        endpoint,
        url 
      }, error);
      throw error;
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

    return response;
  }

  async emailSignup(email: string, password: string, username: string, bio?: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, bio }),
    });

    return response;
  }

  async emailLogin(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return response;
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });

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

  // Follow/Unfollow Methods
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

  // Block/Unblock Methods
  async blockUser(userId: string, reason?: string): Promise<{ message: string }> {
    return this.request(`/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unblockUser(userId: string): Promise<{ message: string }> {
    return this.request(`/users/${userId}/block`, {
      method: 'DELETE',
    });
  }

  async getBlockedUsers(): Promise<{ blocked_users: BlockedUser[] }> {
    return this.request('/users/blocked/list');
  }

  // User Settings Methods
  async getUserSettings(): Promise<{ settings: UserSettings }> {
    return this.request('/users/settings');
  }

  async updateUserSettings(settings: {
    notifications_enabled?: boolean;
    gift_notifications?: boolean;
    live_notifications?: boolean;
  }): Promise<{ message: string; settings: UserSettings }> {
    return this.request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Search Methods
  async searchUsers(query: string, page = 1, limit = 20): Promise<{ users: User[]; page: number; limit: number }> {
    return this.request(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  // New User Profile Methods
  async getUserStreamDuration(userId: string, period: 'weekly' | 'monthly' = 'weekly'): Promise<{ period: string; data: StreamDurationData[] }> {
    return this.request(`/users/${userId}/stream-duration?period=${period}`);
  }

  async getUserTopGifter(userId: string): Promise<{ top_gifter: TopGifter | null }> {
    return this.request(`/users/${userId}/top-gifter`);
  }

  async getUserTopGifts(userId: string, limit = 4): Promise<{ top_gifts: TopGift[] }> {
    return this.request(`/users/${userId}/top-gifts?limit=${limit}`);
  }

  async canUserMessage(userId: string): Promise<{ can_message: boolean }> {
    return this.request(`/users/${userId}/can-message`);
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
    return this.request('/payments/purchase', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod }),
    });
  }

  async sendGift(streamId: string, giftId: string, receiverId: string, message?: string): Promise<{ message: string; gift: Gift; transaction_id: string }> {
    return this.request('/payments/send-gift', {
      method: 'POST',
      body: JSON.stringify({ stream_id: streamId, gift_id: giftId, receiver_id: receiverId, message }),
    });
  }

  async getTransactions(page = 1, limit = 20): Promise<{ transactions: Transaction[]; page: number; limit: number }> {
    return this.request(`/payments/transactions?page=${page}&limit=${limit}`);
  }

  // Earnings and Withdrawal APIs
  async getEarnings(): Promise<EarningsData> {
    return this.request('/payments/earnings');
  }

  async initiateKYC(kycData: KYCData): Promise<{ message: string; kyc_id: string; status: string; estimated_completion: string }> {
    return this.request('/payments/kyc/initiate', {
      method: 'POST',
      body: JSON.stringify(kycData),
    });
  }

  async getKYCStatus(): Promise<{ kyc_status: string; kyc_completed_at?: string; can_withdraw: boolean }> {
    return this.request('/payments/kyc/status');
  }

  async requestWithdrawal(
    amount: number,
    withdrawalMethod: 'bank' | 'paypal' | 'upi',
    accountDetails: any
  ): Promise<{ message: string; withdrawal_id: string; cashfree_payout_id: string; status: string; estimated_credit: string }> {
    return this.request('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        withdrawal_method: withdrawalMethod,
        account_details: accountDetails,
      }),
    });
  }

  async getWithdrawals(page = 1, limit = 20): Promise<{ withdrawals: Withdrawal[]; page: number; limit: number }> {
    return this.request(`/payments/withdrawals?page=${page}&limit=${limit}`);
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
  async generateUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; publicUrl: string; fileName: string; expiresIn: number }> {
    return this.request('/media/upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileType }),
    });
  }

  async uploadProfilePicture(formData: FormData): Promise<{ message: string; profile_pic: string; user: User }> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/media/profile-picture`, {
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

  // Customer Support Methods
  async submitSupportComplaint(complaint: {
    topic: string;
    subject: string;
    description: string;
    email?: string;
    phone?: string;
  }): Promise<{ message: string; complaint: SupportComplaint }> {
    return this.request('/users/support/complaint', {
      method: 'POST',
      body: JSON.stringify(complaint),
    });
  }

  async getSupportComplaints(page: number = 1, limit: number = 10): Promise<{
    complaints: SupportComplaint[];
    page: number;
    limit: number;
  }> {
    return this.request(`/users/support/complaints?page=${page}&limit=${limit}`);
  }

  async getSupportComplaint(complaintId: string): Promise<{ complaint: SupportComplaint }> {
    return this.request(`/users/support/complaints/${complaintId}`);
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient();


