const fs = require('fs');
const path = require('path');

// Get the new ngrok URL from command line argument
const newNgrokUrl = process.argv[2];

if (!newNgrokUrl) {
  console.log('❌ Please provide the new ngrok URL');
  console.log('Usage: node update-ngrok-url.js https://your-ngrok-url.ngrok-free.app');
  console.log('');
  console.log('🔧 Note: For OAuth, you only need to update Google Cloud Console once with:');
  console.log('   https://auth.expo.io/@rahul_1996_s/rork-app');
  process.exit(1);
}

// Update the config file
const configPath = path.join(__dirname, 'lib', 'config.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace the old ngrok URL with the new one
const oldPattern = /BASE_URL: process\.env\.EXPO_PUBLIC_API_BASE_URL \|\| 'https:\/\/[^']+'/;
const newLine = `BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || '${newNgrokUrl}'`;

if (oldPattern.test(configContent)) {
  configContent = configContent.replace(oldPattern, newLine);
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Updated lib/config.ts with new ngrok URL:', newNgrokUrl);
} else {
  console.log('❌ Could not find the BASE_URL line to update');
}

// Also update the .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update EXPO_PUBLIC_API_BASE_URL
  const envPattern = /EXPO_PUBLIC_API_BASE_URL=https:\/\/[^\n]+/;
  const newEnvLine = `EXPO_PUBLIC_API_BASE_URL=${newNgrokUrl}`;
  
  if (envPattern.test(envContent)) {
    envContent = envContent.replace(envPattern, newEnvLine);
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with new ngrok URL');
  } else {
    // Add the line if it doesn't exist
    envContent += `\nEXPO_PUBLIC_API_BASE_URL=${newNgrokUrl}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Added EXPO_PUBLIC_API_BASE_URL to .env file');
  }
} else {
  console.log('⚠️  .env file not found. Please create it manually with:');
  console.log(`EXPO_PUBLIC_API_BASE_URL=${newNgrokUrl}`);
}

console.log('\n🎉 Ngrok URL updated successfully!');
console.log('\n🔧 OAuth Configuration (One-time setup):');
console.log('1. Google Cloud Console redirect URI (never changes):');
console.log('   https://auth.expo.io/@rahul_1996_s/rork-app');
console.log('');
console.log('2. Supabase Auth redirect URL (never changes):');
console.log('   https://auth.expo.io/@rahul_1996_s/rork-app');
console.log('');
console.log('3. Restart your development server:');
console.log('   npm run start');
