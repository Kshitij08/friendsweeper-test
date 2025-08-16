# Cloudflare Production Deployment Guide

This guide will help you deploy the Friendsweeper image API to Cloudflare Workers with R2 storage for production use.

## 🚀 **Overview**

We'll deploy:
1. **Cloudflare Worker** - Handles image upload and serving
2. **Cloudflare R2** - Stores images with global CDN
3. **Next.js App** - Updated to use the production API

## 📋 **Step 1: Cloudflare Account Setup**

### **1.1 Create Cloudflare Account**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign up for a free account
3. Note your **Account ID** (found in the right sidebar)

### **1.2 Enable Workers & R2**
1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Click **Create application**
3. Go to **R2 Object Storage** and create a bucket called `friendsweeper-images`

## 🔧 **Step 2: Cloudflare Worker Setup**

### **2.1 Install Wrangler CLI**
```bash
npm install -g wrangler
```

### **2.2 Login to Cloudflare**
```bash
wrangler login
```

### **2.3 Navigate to Worker Directory**
```bash
cd _cloudflare-worker
```

### **2.4 Install Dependencies**
```bash
npm install
```

### **2.5 Update Configuration**

Edit `_cloudflare-worker/wrangler.jsonc`:
```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "friendsweeper-image-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-06-16",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "vars": {
    "PUBLIC_BUCKET_URL": "https://your-bucket.r2.dev"
  },
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "friendsweeper-images"
    }
  ],
  "unsafe": {
    "bindings": [
      {
        "name": "RATE_LIMITER",
        "type": "ratelimit",
        "namespace_id": "1001",
        "simple": {
          "limit": 10,
          "period": 60
        }
      }
    ]
  }
}
```

**Replace `your-account-id` with your actual Cloudflare Account ID.**

### **2.6 Deploy the Worker**
```bash
npm run deploy
```

This will give you a URL like: `https://friendsweeper-image-api.your-subdomain.workers.dev`

## 🗄️ **Step 3: R2 Bucket Configuration**

### **3.1 Create R2 Bucket**
1. Go to **R2 Object Storage** in Cloudflare Dashboard
2. Click **Create bucket**
3. Name it `friendsweeper-images`
4. Choose a region (or leave as default)

### **3.2 Configure Public Access**
1. Click on your bucket
2. Go to **Settings** tab
3. Enable **Public bucket** (for direct image serving)
4. Note the **Public URL** (e.g., `https://pub-xxxxx.r2.dev`)

### **3.3 Update Worker Configuration**
Update the `PUBLIC_BUCKET_URL` in `wrangler.jsonc` with your actual R2 public URL.

## 🔄 **Step 4: Update Next.js App**

### **4.1 Environment Variables**
Add to your `.env.local`:
```env
# Cloudflare Worker URL (from step 2.6)
CLOUDFLARE_WORKER_URL=https://friendsweeper-image-api.your-subdomain.workers.dev

# R2 Public URL (from step 3.2)
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### **4.2 Update ShareResultModal**
Change the API endpoint in `components/Home/ShareResultModal.tsx`:
```typescript
// Change from:
const uploadResponse = await fetch('/api/upload-board-image-simple', {

// To:
const uploadResponse = await fetch('/api/upload-board-image-production', {
```

## 🧪 **Step 5: Testing**

### **5.1 Test Worker Health**
```bash
curl https://friendsweeper-image-api.your-subdomain.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-16T10:30:00.000Z",
  "bucket": "connected"
}
```

### **5.2 Test Image Upload**
Use the test page at `http://localhost:3000/test-image-upload` but update it to use the production endpoint.

## 🚀 **Step 6: Production Deployment**

### **6.1 Deploy Next.js App**
1. Push your code to GitHub
2. Deploy to Vercel (or your preferred platform)
3. Add environment variables in Vercel dashboard

### **6.2 Environment Variables for Production**
In Vercel dashboard, add:
- `CLOUDFLARE_WORKER_URL`
- `CLOUDFLARE_R2_PUBLIC_URL`

## 📊 **Step 7: Monitoring**

### **7.1 Cloudflare Analytics**
- Go to **Workers & Pages** → Your worker → **Analytics**
- Monitor requests, errors, and performance

### **7.2 R2 Analytics**
- Go to **R2 Object Storage** → Your bucket → **Analytics**
- Monitor storage usage and bandwidth

## 💰 **Pricing**

### **Cloudflare Workers (Free Tier)**
- **100,000 requests/day** (free)
- **10ms CPU time** per request (free)
- **128MB memory** per request (free)

### **Cloudflare R2 (Free Tier)**
- **10GB storage** (free)
- **1,000,000 Class A operations** (free)
- **10,000,000 Class B operations** (free)
- **No egress fees**

### **Example Costs for High Usage**
- 1,000,000 image uploads/month: ~$5
- 10GB storage: Free
- **Total**: ~$5/month for high usage

## 🔧 **API Endpoints**

### **Upload Image**
- **URL**: `https://your-worker.workers.dev/upload/board-image`
- **Method**: `POST`
- **Body**: `{ imageData: string, gameResult: object }`

### **Serve Image**
- **URL**: `https://your-r2-public-url.r2.dev/board-images/filename.png`
- **Method**: `GET`
- **Direct R2 serving** (no worker needed)

### **Health Check**
- **URL**: `https://your-worker.workers.dev/health`
- **Method**: `GET`

## 🛠 **Troubleshooting**

### **Common Issues**

#### **"Worker not found"**
- Check the worker URL in environment variables
- Verify the worker is deployed successfully

#### **"R2 bucket not accessible"**
- Check bucket permissions
- Verify the bucket name in `wrangler.jsonc`

#### **"Rate limit exceeded"**
- Increase rate limit in `wrangler.jsonc`
- Check if you're hitting the free tier limits

#### **"Image not serving"**
- Check R2 public access settings
- Verify the public URL is correct

### **Debug Commands**
```bash
# Test worker locally
cd _cloudflare-worker
npm run dev

# Check worker logs
wrangler tail

# Deploy with verbose logging
wrangler deploy --verbose
```

## 🎯 **Benefits of This Setup**

1. **Global CDN**: Images served from edge locations worldwide
2. **High Performance**: Sub-100ms latency
3. **Cost Effective**: Free tier covers most use cases
4. **Scalable**: Handles millions of requests
5. **Reliable**: 99.9% uptime SLA
6. **No Egress Fees**: Unlike AWS S3

## 📚 **Next Steps**

1. **Set up monitoring** with Cloudflare Analytics
2. **Configure custom domain** for your worker
3. **Add image optimization** with Cloudflare Images
4. **Implement caching strategies** for better performance

Your Friendsweeper game is now ready for production with enterprise-grade image storage! 🚀
