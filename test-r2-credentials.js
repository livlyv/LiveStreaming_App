require('dotenv').config({ path: './backend/.env' });

console.log('🔧 Testing R2 Credentials');
console.log('========================\n');

// R2 Configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

console.log('R2 Configuration:');
console.log('Endpoint:', R2_ENDPOINT);
console.log('Bucket:', R2_BUCKET);
console.log('Access Key:', R2_ACCESS_KEY ? `${R2_ACCESS_KEY.substring(0, 8)}...` : 'NOT SET');
console.log('Secret Key:', R2_SECRET_KEY ? '***configured***' : 'NOT SET');
console.log('Public URL:', R2_PUBLIC_URL);
console.log('');

// Test the credentials format
if (R2_ACCESS_KEY && R2_SECRET_KEY) {
  console.log('✅ R2 credentials are configured');
  
  // Check if credentials look like valid AWS-style keys
  const accessKeyPattern = /^[A-Z0-9]{20}$/;
  const secretKeyPattern = /^[A-Za-z0-9/+=]{40}$/;
  
  if (accessKeyPattern.test(R2_ACCESS_KEY)) {
    console.log('✅ Access Key format looks valid');
  } else {
    console.log('❌ Access Key format may be invalid (should be 20 characters, uppercase letters and numbers)');
  }
  
  if (secretKeyPattern.test(R2_SECRET_KEY)) {
    console.log('✅ Secret Key format looks valid');
  } else {
    console.log('❌ Secret Key format may be invalid (should be 40 characters, base64-like)');
  }
  
  console.log('');
  console.log('🔍 Troubleshooting Tips:');
  console.log('1. Make sure you copied the full Access Key and Secret Key from Cloudflare R2');
  console.log('2. Access Key should be exactly 20 characters');
  console.log('3. Secret Key should be exactly 40 characters');
  console.log('4. Check that there are no extra spaces or characters');
  console.log('5. Verify the bucket name matches exactly');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Double-check your R2 credentials in backend/.env');
  console.log('2. Restart the backend server');
  console.log('3. Test profile picture upload again');
  
} else {
  console.log('❌ R2 credentials are missing');
  console.log('');
  console.log('Please add the following to backend/.env:');
  console.log('R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com');
  console.log('R2_BUCKET=your-bucket-name');
  console.log('R2_ACCESS_KEY=your_r2_access_key');
  console.log('R2_SECRET_KEY=your_r2_secret_key');
  console.log('R2_PUBLIC_URL=https://your-bucket-name.your-account-id.r2.cloudflarestorage.com');
}
