const { Router } = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const fetch = require('node-fetch');

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Cloudflare R2 configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://your-account-id.r2.cloudflarestorage.com';
const R2_BUCKET = process.env.R2_BUCKET || 'your-bucket-name';
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://your-cdn-domain.com';

// Generate presigned upload URL for Cloudflare R2
router.post('/upload-url', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'fileName and fileType are required' });
  }

  // Validate file type
  if (!fileType.startsWith('image/')) {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }

  try {
    // Generate unique filename
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `profile-pictures/${req.user.id}-${uuidv4()}.${fileExtension}`;
    
    // Create presigned URL for Cloudflare R2
    const expiresIn = 3600; // 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    // Create the presigned URL using AWS S3 compatible API
    const presignedUrl = await generatePresignedUrl(uniqueFileName, fileType, expiresIn);
    const publicUrl = `${R2_PUBLIC_URL}/${uniqueFileName}`;

    res.json({
      uploadUrl: presignedUrl,
      publicUrl: publicUrl,
      fileName: uniqueFileName,
      expiresIn: expiresIn
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}));

// Upload profile picture directly to R2
router.post('/profile-picture', 
  upload.single('profile_picture'),
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    try {
      // Get user's username for filename
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', req.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return res.status(500).json({ error: 'Failed to fetch user data' });
      }

      // Generate filename with username and user ID
      const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
      const sanitizedUsername = userData.username.replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueFileName = `profile-pictures/${sanitizedUsername}_${req.user.id}.${fileExtension}`;
      
      // Upload to Cloudflare R2
      const imageUrl = await uploadToR2(uniqueFileName, req.file.buffer, req.file.mimetype);

      // Update user's profile picture in database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({ 
          profile_pic: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        return res.status(500).json({ error: 'Failed to update profile picture in database' });
      }

      res.json({
        message: 'Profile picture uploaded successfully',
        profile_pic: imageUrl,
        user: {
          id: user.id,
          username: user.username,
          profile_pic: user.profile_pic,
          updated_at: user.updated_at
        }
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  })
);

// Helper function to generate presigned URL for R2
async function generatePresignedUrl(key, contentType, expiresIn = 3600) {
  const crypto = require('crypto');
  
  const date = new Date();
  const dateISO = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateShort = date.toISOString().slice(0, 10).replace(/-/g, '');
  
     // Extract region from R2 endpoint or use default
     const region = 'us-east-1'; // R2 default region
     const credential = `${R2_ACCESS_KEY}/${dateShort}/${region}/s3/aws4_request`;
   
   const payloadHash = crypto.createHash('sha256').update('').digest('hex');
  
           // Create headers object and sort them alphabetically
      const headers = {
        'content-type': contentType.trim(),
        'host': R2_ENDPOINT.replace('https://', '').trim(),
        'x-amz-content-sha256': payloadHash.trim(),
        'x-amz-date': dateISO.trim()
      };
     
     // Sort headers alphabetically and create sorted headers string
     const sortedHeaderKeys = Object.keys(headers).sort();
     const sortedHeaders = sortedHeaderKeys
       .map(key => `${key}:${headers[key]}`)
       .join('\n');
     
     // Create signedHeaders in the same order as sortedHeaders
     const signedHeaders = sortedHeaderKeys.join(';');
     
           // Use the key path with bucket name (path-style access)
      const encodedKey = `/${R2_BUCKET}/${key}`;
     
                       const canonicalRequest = `PUT
${encodedKey}

${sortedHeaders}

${signedHeaders}
${payloadHash}`;
  
                       const stringToSign = [
       'AWS4-HMAC-SHA256',
       dateISO,
       `${dateShort}/${region}/s3/aws4_request`,
       crypto.createHash('sha256').update(canonicalRequest).digest('hex')
     ].join('\n');
   
                       const dateKey = crypto.createHmac('sha256', `AWS4${R2_SECRET_KEY}`).update(dateShort).digest();
     const dateRegionKey = crypto.createHmac('sha256', dateKey).update(region).digest();
     const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update('s3').digest();
     const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
  
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  
  const presignedUrl = `${R2_ENDPOINT}/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(credential)}&X-Amz-Date=${dateISO}&X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=${signedHeaders}&X-Amz-Signature=${signature}`;
  
  return presignedUrl;
}

// Helper function to upload file directly to R2
async function uploadToR2(key, buffer, contentType) {
  try {
    // Check if R2 credentials are configured
    if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_ENDPOINT || !R2_PUBLIC_URL) {
      console.error('R2 credentials not configured. Please set R2_ACCESS_KEY, R2_SECRET_KEY, R2_ENDPOINT, and R2_PUBLIC_URL');
      throw new Error('R2 credentials not configured');
    }

    console.log('Uploading to R2:', key);
    
    // Use path-style access: https://<account>.r2.cloudflarestorage.com/<bucket>/<object>
    const r2Url = `${R2_ENDPOINT}/${R2_BUCKET}/${key}`;
    
    console.log('R2 URL:', r2Url);
    
    // Generate AWS4 signature for R2
    const crypto = require('crypto');
    const date = new Date();
    const dateISO = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateShort = date.toISOString().slice(0, 10).replace(/-/g, '');
    
                   // Extract region from R2 endpoint or use default
          const region = 'us-east-1'; // R2 default region
                   const credential = `${R2_ACCESS_KEY}/${dateShort}/${region}/s3/aws4_request`;
     
     const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Use the exact host from R2 endpoint (path-style access)
    const host = R2_ENDPOINT.replace('https://', '');
    
    // Create headers object and sort them alphabetically
    const headers = {
      'content-type': contentType.trim(),
      'host': host.trim(),
      'x-amz-content-sha256': payloadHash.trim(),
      'x-amz-date': dateISO.trim()
    };
    
    // Sort headers alphabetically and create sorted headers string
    const sortedHeaderKeys = Object.keys(headers).sort();
    const sortedHeaders = sortedHeaderKeys
      .map(key => `${key}:${headers[key]}`)
      .join('\n');
    
    // Create signedHeaders in the same order as sortedHeaders
    const signedHeaders = sortedHeaderKeys.join(';');
    
    // Use the key path with bucket name (path-style access)
    const encodedKey = `/${R2_BUCKET}/${key}`;
    
    const canonicalRequest = `PUT
${encodedKey}

${sortedHeaders}

${signedHeaders}
${payloadHash}`;
    
         const stringToSign = [
       'AWS4-HMAC-SHA256',
       dateISO,
       `${dateShort}/${region}/s3/aws4_request`,
       crypto.createHash('sha256').update(canonicalRequest).digest('hex')
     ].join('\n');
    
         // Fix: Use the correct secret key format for R2 (add AWS4 prefix)
     const dateKey = crypto.createHmac('sha256', `AWS4${R2_SECRET_KEY}`).update(dateShort).digest();
     const dateRegionKey = crypto.createHmac('sha256', dateKey).update(region).digest();
     const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update('s3').digest();
     const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
    
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    const authorization = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    // Debug: Log the signature components
    console.log('Debug - Date ISO:', dateISO);
    console.log('Debug - Date Short:', dateShort);
    console.log('Debug - Credential:', credential);
    console.log('Debug - Host:', host);
    console.log('Debug - Payload Hash:', payloadHash);
    console.log('Debug - Canonical Request:', canonicalRequest);
    console.log('Debug - String To Sign:', stringToSign);
    console.log('Debug - Signature:', signature);
    
    // Upload to R2 - use exact same headers as signed
    const requestHeaders = {};
    sortedHeaderKeys.forEach(key => {
      requestHeaders[key] = headers[key];
    });
    requestHeaders['authorization'] = authorization;
    
    const response = await fetch(r2Url, {
      method: 'PUT',
      headers: requestHeaders,
      body: buffer
    });

    if (!response.ok) {
      console.error('R2 upload failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
    }

    console.log('R2 upload successful:', key);
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload to R2');
  }
}

// Get user's uploaded files
router.get('/my-files', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { page = 1, limit = 20, type } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    // TODO: Implement file listing from Cloudflare R2
    // For now, return empty list
    res.json({
      files: [],
      page: Number(page),
      limit: Number(limit),
      total: 0
    });
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ error: 'Failed to fetch user files' });
  }
}));

// Delete file
router.delete('/:fileId', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { fileId } = req.params;

  try {
    // TODO: Delete from Cloudflare R2
    // For now, just return success
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}));

// Get file by ID
router.get('/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  try {
    // TODO: Get file info from Cloudflare R2
    // For now, return 404
    res.status(404).json({ error: 'File not found' });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
}));

module.exports = router;
