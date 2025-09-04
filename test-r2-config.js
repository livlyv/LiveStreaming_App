require('dotenv').config({ path: './backend/.env' });

console.log('🔧 Testing R2 Configuration');
console.log('============================\n');

// Check environment variables
const requiredVars = [
  'R2_ENDPOINT',
  'R2_BUCKET', 
  'R2_ACCESS_KEY',
  'R2_SECRET_KEY',
  'R2_PUBLIC_URL'
];

let allConfigured = true;

console.log('Environment Variables Check:');
console.log('----------------------------');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***configured***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT CONFIGURED`);
    allConfigured = false;
  }
});

console.log('');

if (!allConfigured) {
  console.log('❌ R2 Configuration Incomplete');
  console.log('');
  console.log('To complete R2 setup:');
  console.log('1. Create a .env file in the backend directory');
  console.log('2. Add your R2 credentials:');
  console.log('');
  console.log('R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com');
  console.log('R2_BUCKET=your-bucket-name');
  console.log('R2_ACCESS_KEY=your_r2_access_key');
  console.log('R2_SECRET_KEY=your_r2_secret_key');
  console.log('R2_PUBLIC_URL=https://your-bucket-name.your-account-id.r2.cloudflarestorage.com');
  console.log('');
  console.log('3. Restart your backend server');
  console.log('4. Test profile picture upload');
} else {
  console.log('✅ R2 Configuration Complete!');
  console.log('');
  console.log('You can now:');
  console.log('1. Start your backend server');
  console.log('2. Test profile picture upload from the app');
  console.log('3. Images will be stored in R2 with format: username_userid.jpg');
}

console.log('');
console.log('📝 Next Steps:');
console.log('1. Create .env file in backend directory with your R2 credentials');
console.log('2. Restart backend server: npm run start:backend');
console.log('3. Test profile picture upload from the app');
console.log('4. Check R2 bucket for uploaded images');
