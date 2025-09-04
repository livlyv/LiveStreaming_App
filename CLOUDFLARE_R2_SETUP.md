# 🚀 Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 for profile picture uploads in your live streaming app.

## 📋 Prerequisites

- Cloudflare account
- R2 bucket created
- API tokens configured

## 🔧 Step-by-Step Setup

### 1. Create R2 Bucket

1. **Login to Cloudflare Dashboard**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **R2 Object Storage**

2. **Create New Bucket**
   - Click **Create bucket**
   - Name: `live-streaming-app-media` (or your preferred name)
   - Region: Choose closest to your users
   - Click **Create bucket**

### 2. Configure R2 API Tokens

1. **Create API Token**
   - Go to **My Profile** → **API Tokens**
   - Click **Create Token**
   - Use **Custom token** template

2. **Configure Permissions**
   ```
   Account Permissions:
   - Cloudflare R2:Edit
   
   Zone Permissions:
   - None (for R2, we don't need zone permissions)
   ```

3. **Set Token Details**
   - Token name: `Live Streaming App R2`
   - TTL: No expiration (or set as needed)
   - Click **Continue to summary** → **Create Token**

4. **Save Credentials**
   - Copy the **Access Key ID** and **Secret Access Key**
   - Store them securely (you'll need them for environment variables)

### 3. Configure Public Access (Optional)

If you want public read access to uploaded images:

1. **Go to R2 Bucket Settings**
   - Select your bucket
   - Go to **Settings** tab

2. **Enable Public Access**
   - Toggle **Public access** to ON
   - Note the **Public URL** (you'll need this for `R2_PUBLIC_URL`)

### 4. Environment Variables

Add these to your `backend/.env` file:

```env
# Cloudflare R2 Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET=live-streaming-app-media
R2_ACCESS_KEY=your_access_key_id
R2_SECRET_KEY=your_secret_access_key
R2_PUBLIC_URL=https://your-cdn-domain.com
```

### 5. Install Dependencies

The backend already includes the necessary dependencies:
- `node-fetch` (for HTTP requests)
- `multer` (for file upload handling)
- `crypto` (built-in, for AWS signature generation)

### 6. Test the Setup

1. **Start your backend server**
   ```bash
   cd backend
   npm run start:backend
   ```

2. **Test upload endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/media/profile-picture \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "image=@test-image.jpg"
   ```

## 🔍 How It Works

### Upload Flow

1. **User selects image** in the app
2. **Image picker** opens (camera or gallery)
3. **Image is processed** (compressed, resized)
4. **File is sent** to backend via FormData
5. **Backend uploads** to R2 bucket
6. **Database is updated** with new profile picture URL
7. **User sees** updated profile picture

### File Structure

```
R2 Bucket:
├── profile-pictures/
│   ├── user-id-1-uuid.jpg
│   ├── user-id-2-uuid.png
│   └── ...
├── stream-thumbnails/
│   └── ...
└── other-media/
    └── ...
```

### Security Features

- **Unique filenames**: UUID-based naming prevents conflicts
- **File type validation**: Only images allowed
- **Size limits**: 5MB maximum file size
- **Authentication**: All uploads require valid JWT token
- **Organized structure**: Files organized by type and user

## 🛠️ Troubleshooting

### Common Issues

1. **"R2 upload failed"**
   - Check your R2 credentials
   - Verify bucket name and endpoint
   - Ensure API token has correct permissions

2. **"Permission denied"**
   - Verify R2_ACCESS_KEY and R2_SECRET_KEY
   - Check bucket permissions
   - Ensure bucket exists

3. **"File not found"**
   - Check R2_PUBLIC_URL configuration
   - Verify file was uploaded successfully
   - Check bucket public access settings

### Debug Steps

1. **Check environment variables**
   ```bash
   echo $R2_ENDPOINT
   echo $R2_BUCKET
   echo $R2_ACCESS_KEY
   ```

2. **Test R2 connection**
   ```javascript
   // Add this to your backend for testing
   const testR2Connection = async () => {
     try {
       const response = await fetch(`${R2_ENDPOINT}/test`, {
         method: 'HEAD',
         headers: {
           'Authorization': `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}`
         }
       });
       console.log('R2 connection:', response.status);
     } catch (error) {
       console.error('R2 connection failed:', error);
     }
   };
   ```

3. **Check logs**
   - Monitor backend console for errors
   - Check R2 bucket for uploaded files
   - Verify database updates

## 📈 Performance Optimization

### Image Processing

- **Compression**: Images are compressed to 80% quality
- **Resizing**: Square aspect ratio (1:1) for profile pictures
- **Format**: JPEG for better compression

### CDN Benefits

- **Global distribution**: Files served from edge locations
- **Caching**: Automatic caching for better performance
- **Compression**: Automatic image optimization

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit credentials to git
   - Use different keys for development/production
   - Rotate keys regularly

2. **File Validation**
   - Validate file types server-side
   - Check file size limits
   - Scan for malicious content

3. **Access Control**
   - Use presigned URLs for secure uploads
   - Implement proper authentication
   - Monitor upload patterns

## 🚀 Production Deployment

### Environment Setup

1. **Production R2 Bucket**
   - Create separate bucket for production
   - Configure proper CORS settings
   - Set up monitoring and alerts

2. **CDN Configuration**
   - Configure custom domain for R2
   - Set up SSL certificates
   - Configure caching rules

3. **Monitoring**
   - Set up R2 usage alerts
   - Monitor upload success rates
   - Track storage costs

### Scaling Considerations

- **Storage limits**: R2 has generous storage limits
- **Bandwidth**: Pay-as-you-go pricing
- **Requests**: No request limits for reasonable usage

## 📞 Support

If you encounter issues:

1. **Check Cloudflare R2 documentation**
2. **Verify your configuration**
3. **Test with minimal setup**
4. **Contact support if needed**

---

**Next Steps:**
- Test the upload functionality
- Configure your production environment
- Set up monitoring and alerts
- Optimize for your specific use case
