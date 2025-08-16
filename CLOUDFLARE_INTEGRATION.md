# Cloudflare Integration for Image Sharing

This document explains how to integrate Cloudflare R2 for image storage in your Friendsweeper game, following the pattern from the [vrgda-exp repository](https://github.com/piyush-json/vrgda-exp/tree/master/api).

## 🚀 **Current Implementation**

### **Simplified Version (In-Memory Storage)**
- **File**: `app/api/upload-board-image-simple/route.ts`
- **Serving**: `app/api/serve-image/[key]/route.ts`
- **Pattern**: Follows the GitHub repository structure with validation and metadata

### **Cloudflare R2 Version (Production Ready)**
- **File**: `app/api/upload-board-image/route.ts`
- **Storage**: Cloudflare R2 with global CDN
- **Features**: Rate limiting, validation, metadata storage

## 📋 **Setup Instructions**

### **Option 1: Quick Start (In-Memory)**
No setup required! The simplified version works immediately with in-memory storage.

### **Option 2: Cloudflare R2 (Recommended for Production)**

#### **Step 1: Create Cloudflare R2 Bucket**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Create a new bucket called `friendsweeper-images`
4. Note your **Account ID** (found in the right sidebar)

#### **Step 2: Create API Token**
1. In R2 dashboard, go to **Manage R2 API Tokens**
2. Click **Create API Token**
3. Select **Custom token**
4. Add permissions:
   - **Object Read** (for serving images)
   - **Object Write** (for uploading images)
5. Save the **Access Key ID** and **Secret Access Key**

#### **Step 3: Environment Variables**
Add to your `.env.local`:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=friendsweeper-images
```

#### **Step 4: Install Dependencies**
```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### **Step 5: Update ShareResultModal**
Change the API endpoint in `components/Home/ShareResultModal.tsx`:
```typescript
// Change from:
const uploadResponse = await fetch('/api/upload-board-image-simple', {

// To:
const uploadResponse = await fetch('/api/upload-board-image', {
```

## 🔧 **API Endpoints**

### **Upload Image**
- **POST** `/api/upload-board-image-simple` (or `/api/upload-board-image` for R2)
- **Body**: `{ imageData: string, gameResult: object }`
- **Response**: `{ success: true, key: string, publicUrl: string }`

### **Serve Image**
- **GET** `/api/serve-image/[key]`
- **Response**: Image file with proper headers

## 🎯 **Features**

### **Base64 Validation**
```typescript
function validateBase64Image(imageData: string) {
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  // Validates proper data URL format
}
```

### **Automatic Cleanup**
- Images expire after 1 hour (in-memory version)
- Automatic cleanup of expired images
- Metadata storage for game results

### **CORS Support**
- Proper CORS headers for cross-origin requests
- Support for Farcaster embeds

### **Error Handling**
- Comprehensive error messages
- Fallback to data URLs if upload fails
- Graceful degradation

## 🔄 **Migration Path**

### **Development → Production**
1. Start with in-memory storage (`upload-board-image-simple`)
2. Test image upload and serving
3. Set up Cloudflare R2
4. Switch to R2 storage (`upload-board-image`)
5. Deploy to production

### **Benefits of Cloudflare R2**
- **Global CDN**: Sub-100ms latency worldwide
- **No Egress Fees**: Unlike AWS S3
- **S3 Compatible**: Easy migration
- **High Performance**: 99.9% uptime SLA

## 💰 **Pricing**

### **Cloudflare R2**
- **Storage**: $0.015 per GB/month
- **Class A Operations** (PUT, POST, DELETE): $4.50 per million
- **Class B Operations** (GET, HEAD): **FREE**
- **No egress fees**

### **Example Costs**
- 1000 game images (1MB each): ~$0.015/month storage
- 10,000 uploads/day: ~$1.35/month
- **Total**: ~$1.37/month for high usage

## 🚀 **Deployment**

### **Vercel Deployment**
1. Add environment variables to Vercel project settings
2. Deploy your Next.js app
3. Images will be served from Cloudflare R2 globally

### **Local Development**
1. Use in-memory storage for development
2. Switch to R2 for production testing
3. Environment-based configuration

## 🔍 **Monitoring**

### **Console Logs**
```typescript
console.log('Image uploaded to Cloudflare R2:', key);
console.log('Public URL:', publicUrl);
```

### **Error Tracking**
- Failed uploads logged with details
- Validation errors with specific messages
- Network errors with retry information

## 🛠 **Troubleshooting**

### **Common Issues**

#### **"Image must be a valid base64 data URL"**
- Ensure image data starts with `data:image/png;base64,`
- Check that the base64 string is complete

#### **"Failed to upload image"**
- Check Cloudflare R2 credentials
- Verify bucket permissions
- Check network connectivity

#### **"Image not found"**
- Image may have expired (1 hour limit)
- Check the image key in the URL
- Verify the image was uploaded successfully

### **Debug Mode**
Enable detailed logging by adding to your environment:
```env
DEBUG_IMAGE_UPLOAD=true
```

## 📚 **References**

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [GitHub Repository Pattern](https://github.com/piyush-json/vrgda-exp/tree/master/api)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-examples.html)
