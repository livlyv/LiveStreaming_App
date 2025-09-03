#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to update ngrok URL in centralized config
function updateNgrokURL(newUrl) {
  console.log(`🔄 Updating ngrok URL to: ${newUrl}`);
  
  // Update lib/config.ts (the single source of truth)
  const configPath = path.join(__dirname, 'lib', 'config.ts');
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');
    configContent = configContent.replace(
      /BASE_URL: process\.env\.EXPO_PUBLIC_API_BASE_URL \|\| '[^']*'/,
      `BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || '${newUrl}'`
    );
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Updated lib/config.ts');
  }
  
  console.log('🎉 Configuration updated successfully!');
  console.log(`📝 New API URL: ${newUrl}/api`);
  console.log('🔄 Restart your frontend to apply changes');
  console.log('💡 All files now import from lib/config.ts - no need to update multiple files!');
}

// Get ngrok URL from command line argument
const newUrl = process.argv[2];

if (!newUrl) {
  console.log('❌ Please provide the new ngrok URL');
  console.log('Usage: node update-ngrok.js <ngrok-url>');
  console.log('Example: node update-ngrok.js https://abc123.ngrok-free.app');
  process.exit(1);
}

// Validate URL format
if (!newUrl.startsWith('https://') && !newUrl.startsWith('http://')) {
  console.log('❌ Please provide a valid URL starting with http:// or https://');
  process.exit(1);
}

updateNgrokURL(newUrl);
