# Vercel Deployment Guide for Friendsweeper

This guide will help you deploy your Friendsweeper app to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Your code should be in a Git repository
3. **Upstash Redis**: For data storage (already configured in your app)
4. **Neynar API Key**: For Farcaster integration

## Step 1: Prepare Your Repository

Your project is already well-configured for Vercel deployment with:
- ✅ Next.js 14.2.6
- ✅ TypeScript configuration
- ✅ Proper package.json with build scripts
- ✅ Vercel configuration file (`vercel.json`)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Vercel will automatically detect it's a Next.js project

3. **Configure Environment Variables**:
   In the Vercel dashboard, add these environment variables:
   
   ```
   NEXT_PUBLIC_URL=https://your-app-name.vercel.app
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   NEYNAR_API_KEY=your_neynar_api_key
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your app automatically

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set environment variables when prompted

## Step 3: Configure Environment Variables

### Required Environment Variables:

1. **NEXT_PUBLIC_URL**: Your Vercel app URL
   ```
   NEXT_PUBLIC_URL=https://your-app-name.vercel.app
   ```

2. **UPSTASH_REDIS_REST_URL**: Your Upstash Redis URL
   ```
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   ```

3. **UPSTASH_REDIS_REST_TOKEN**: Your Upstash Redis token
   ```
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   ```

4. **NEYNAR_API_KEY**: Your Neynar API key for webhook verification
   ```
   NEYNAR_API_KEY=your_neynar_api_key
   ```

### How to Set Environment Variables in Vercel:

1. Go to your project dashboard in Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable with the appropriate environment (Production, Preview, Development)

## Step 4: Configure Farcaster Mini App

After deployment, you'll need to:

1. **Update your Farcaster Mini App configuration** with the new Vercel URL
2. **Configure webhook endpoints** to point to your Vercel deployment
3. **Test the webhook** at `https://your-app.vercel.app/api/webhook`

## Step 5: Verify Deployment

1. **Check the build logs** in Vercel dashboard
2. **Test your app** at the deployed URL
3. **Verify API endpoints** are working:
   - `/api/webhook` - Webhook endpoint
   - `/api/followers` - Followers API
   - `/api/og` - Open Graph images
   - `/api/send-notification` - Notification API

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation passes locally

2. **Environment Variables**:
   - Verify all required env vars are set in Vercel
   - Check that `NEXT_PUBLIC_URL` matches your deployment URL

3. **API Errors**:
   - Ensure Upstash Redis credentials are correct
   - Verify Neynar API key is valid

4. **Webhook Issues**:
   - Check that the webhook URL is accessible
   - Verify webhook signature verification is working

### Performance Optimization:

- Your app is already optimized with:
  - Next.js 14 with App Router
  - Proper caching headers
  - Optimized build configuration

## Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Configure monitoring** and analytics
3. **Set up automatic deployments** from your main branch
4. **Configure preview deployments** for pull requests

## Support

If you encounter issues:
- Check Vercel's [deployment documentation](https://vercel.com/docs)
- Review your build logs in the Vercel dashboard
- Ensure all environment variables are properly configured
