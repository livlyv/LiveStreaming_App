// Configuration file for API endpoints
// This file now imports from the centralized config
// Update lib/config.ts when your ngrok URL changes

const { API_CONFIG } = require('./lib/config.ts');

const config = {
  // API Base URL - imported from centralized config
  API_BASE_URL: API_CONFIG.API_BASE_URL,
  
  // Fallback URLs
  FALLBACK_URLS: API_CONFIG.FALLBACK_URLS,
  
  // Environment
  ENV: API_CONFIG.ENV,
  
  // Backend Host (for server)
  BACKEND_HOST: API_CONFIG.BACKEND_HOST,
  BACKEND_PORT: API_CONFIG.BACKEND_PORT
};

module.exports = config;
