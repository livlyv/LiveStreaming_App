require('dotenv').config({ path: './backend/.env' });
const fetch = require('node-fetch');
const crypto = require('crypto');

console.log('🧪 Testing R2 Upload Functionality');
console.log('==================================\n');

// R2 Configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_ENDPOINT || !R2_PUBLIC_URL) {
  console.log('❌ R2 credentials not configured');
  process.exit(1);
}

// Test upload function (same as in media.js)
async function testUploadToR2(key, buffer, contentType) {
  try {
    console.log('Uploading test file to R2:', key);
    
    // Create the full R2 endpoint URL
    const r2Url = `${R2_ENDPOINT}/${key}`;
    
    // Generate AWS4 signature for R2
    const date = new Date();
    const dateISO = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateShort = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    const credential = `${R2_ACCESS_KEY}/${dateShort}/auto/s3/aws4_request`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    
    const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    const canonicalRequest = [
      'PUT',
      `/${key}`,
      '',
      `content-type:${contentType}`,
      `host:${R2_BUCKET}.${R2_ENDPOINT.replace('https://', '')}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${dateISO}`,
      '',
      signedHeaders,
      payloadHash
    ].join('\n');
    
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      dateISO,
      `${dateShort}/auto/s3/aws4_request`,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');
    
    const dateKey = crypto.createHmac('sha256', `AWS4${R2_SECRET_KEY}`).update(dateShort).digest();
    const dateRegionKey = crypto.createHmac('sha256', dateKey).update('auto').digest();
    const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update('s3').digest();
    const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
    
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    const authorization = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    // Upload to R2
    const response = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Authorization': authorization,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': dateISO,
      },
      body: buffer
    });

    if (!response.ok) {
      console.error('R2 upload failed:', response.status, response.statusText);
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
    }

    console.log('✅ R2 upload successful:', key);
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('❌ R2 upload error:', error);
    throw new Error('Failed to upload to R2');
  }
}

// Test with a simple text file
async function runTest() {
  try {
    const testKey = 'test/test-upload.txt';
    const testContent = 'This is a test upload to verify R2 functionality';
    const buffer = Buffer.from(testContent, 'utf8');
    
    console.log('Testing R2 upload with sample file...');
    const url = await testUploadToR2(testKey, buffer, 'text/plain');
    
    console.log('\n✅ R2 Upload Test Successful!');
    console.log('📁 Test file uploaded to:', url);
    console.log('');
    console.log('🎉 Your R2 configuration is working correctly!');
    console.log('You can now upload profile pictures from the app.');
    
  } catch (error) {
    console.log('\n❌ R2 Upload Test Failed');
    console.log('Error:', error.message);
    console.log('');
    console.log('Please check your R2 credentials and bucket permissions.');
  }
}

runTest();
