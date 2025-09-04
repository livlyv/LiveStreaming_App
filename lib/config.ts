// Centralized configuration for the entire app
// Update this file when your ngrok URL changes

export const API_CONFIG = {
  // API Base URL - Update this when ngrok URL changes
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://4664261d5bf7.ngrok-free.app',
  API_PATH: '/api',
  
  // Computed API Base URL
  get API_BASE_URL() {
    return this.BASE_URL + this.API_PATH;
  },
  
  // Fallback URLs
  FALLBACK_URLS: [
    'http://localhost:3000/api',
    'http://192.168.1.42:3000/api'
  ],
  
  // Environment
  ENV: process.env.NODE_ENV || 'development',
  
  // Backend Host (for server)
  BACKEND_HOST: process.env.HOST || 'localhost',
  BACKEND_PORT: process.env.PORT || 3000
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key',
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'your_google_client_id'
};

// Export the computed API base URL for easy access
export const API_BASE_URL = API_CONFIG.API_BASE_URL;

// Export individual parts for flexibility
export const { BASE_URL, API_PATH, FALLBACK_URLS, ENV, BACKEND_HOST, BACKEND_PORT } = API_CONFIG;
export const { URL: SUPABASE_URL, ANON_KEY: SUPABASE_ANON_KEY, GOOGLE_CLIENT_ID } = SUPABASE_CONFIG;
