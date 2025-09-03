// Centralized configuration for the entire app (JavaScript version for backend)
// Update this file when your ngrok URL changes

const API_CONFIG = {
  // API Base URL - Update this when ngrok URL changes
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'hhttps://cb75c9d1a0d5.ngrok-free.app',
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

// Export the computed API base URL for easy access
const API_BASE_URL = API_CONFIG.API_BASE_URL;

// Export individual parts for flexibility
const { BASE_URL, API_PATH, FALLBACK_URLS, ENV, BACKEND_HOST, BACKEND_PORT } = API_CONFIG;

module.exports = {
  API_CONFIG,
  API_BASE_URL,
  BASE_URL,
  API_PATH,
  FALLBACK_URLS,
  ENV,
  BACKEND_HOST,
  BACKEND_PORT
};
