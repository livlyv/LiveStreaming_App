require('dotenv').config({ path: './backend/.env' });

console.log('🧪 Simple R2 Test');
console.log('==================\n');

// Check if we can access the R2 bucket directly
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_PUBLIC_URL) {
  console.log('❌ R2_PUBLIC_URL not configured');
  process.exit(1);
}

console.log('Testing R2 public access...');
console.log('Public URL:', R2_PUBLIC_URL);

// Test if we can access a file (even if it doesn't exist)
const testUrl = `${R2_PUBLIC_URL}/test-file.txt`;

console.log('Testing URL:', testUrl);

// Simple fetch test
fetch(testUrl)
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 404) {
      console.log('✅ R2 bucket is accessible (404 is expected for non-existent file)');
      console.log('🎉 Your R2 configuration is working!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Start your backend server');
      console.log('2. Test profile picture upload from the app');
      console.log('3. Images will be stored with format: username_userid.jpg');
    } else if (response.status === 200) {
      console.log('✅ R2 bucket is accessible and file exists');
    } else {
      console.log('❌ Unexpected response:', response.status);
    }
  })
  .catch(error => {
    console.log('❌ Error accessing R2:', error.message);
    console.log('');
    console.log('Please check:');
    console.log('1. R2 bucket permissions');
    console.log('2. Public access settings');
    console.log('3. Custom domain configuration');
  });
