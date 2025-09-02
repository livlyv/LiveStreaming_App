import { createClient } from '@supabase/supabase-js';

// Debug environment variables
console.log('🔧 Supabase Environment Check:');
console.log('🔧 SUPABASE_URL:', process.env.SUPABASE_URL ? 'configured' : 'missing');
console.log('🔧 SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing');
console.log('🔧 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Client for frontend operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
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

export interface AuthSession {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}