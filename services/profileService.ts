const API_BASE_URL = (process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/api';

export interface PresignResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export class ProfileService {
  static async presignUpload(userId: string, contentType: string): Promise<PresignResponse> {
    const res = await fetch(`${API_BASE_URL}/users/presign-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, contentType })
    });
    if (!res.ok) throw new Error(`Failed to presign: ${res.status}`);
    return res.json();
  }

  static async uploadToSignedUrl(uploadUrl: string, blob: Blob, contentType: string): Promise<void> {
    const put = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } });
    if (!put.ok) {
      const text = await put.text().catch(() => '');
      throw new Error(`Upload failed: ${put.status} ${text}`);
    }
  }

  static async saveProfilePicture(userId: string, url: string): Promise<{ success: boolean; url: string }> {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/profile-picture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error(`Failed to save profile picture: ${res.status}`);
    return res.json();
  }

  static async toggleFollow(targetUserId: string, followerId: string): Promise<{ following: boolean; followers_count: number | null; following_count: number | null }> {
    const res = await fetch(`${API_BASE_URL}/users/${targetUserId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId })
    });
    if (!res.ok) throw new Error(`Failed to toggle follow: ${res.status}`);
    return res.json();
  }

  static async initiateMessage(toUserId: string, fromUserId: string): Promise<{ ok: boolean; allowed: boolean; threadId?: string; required?: number; total?: number }>{
    const res = await fetch(`${API_BASE_URL}/users/${toUserId}/message/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId })
    });
    return res.json();
  }

  static async getProfileStats(userId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/analytics/profile/${userId}`);
    if (!res.ok) throw new Error(`Failed to load stats: ${res.status}`);
    return res.json();
  }

  static async getDurations(userId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/analytics/streams/duration/${userId}`);
    if (!res.ok) throw new Error(`Failed to load durations: ${res.status}`);
    return res.json();
  }
}

export const profileService = ProfileService;
