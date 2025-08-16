# Vercel Deployment Guide for NFT Marketplace

## 🚀 **Pre-Deployment Checklist**

### **1. Environment Variables Setup**

Before deploying to Vercel, ensure you have these environment variables ready:

```bash
# NFT Contract Configuration
NFT_CONTRACT_ADDRESS=0x... # Your deployed NFT contract address
CONTRACT_OWNER_PRIVATE_KEY=0x... # Your private key (keep this secret!)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=84532

# Cloudflare Configuration (if using Cloudflare for image storage)
CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev

# Existing Configuration
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
NEYNAR_API_KEY=your_neynar_api_key
```

### **2. Vercel Dashboard Configuration**

#### **Step 1: Add Environment Variables**
1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each environment variable from the list above
4. Set **Environment** to **Production** for all variables
5. Click **Save**

#### **Step 2: Configure Build Settings**
1. Go to **Settings → General**
2. Ensure **Framework Preset** is set to **Next.js**
3. **Build Command** should be: `npm run build`
4. **Output Directory** should be: `.next`
5. **Install Command** should be: `npm install`

#### **Step 3: Configure Domains (Optional)**
1. Go to **Settings → Domains**
2. Add your custom domain if needed
3. Configure DNS settings as required

### **3. Deployment Steps**

#### **Option A: Deploy via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### **Option B: Deploy via GitHub Integration**
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on every push

#### **Option C: Deploy via Vercel Dashboard**
1. Go to your Vercel dashboard
2. Click **Deploy**
3. Import your repository
4. Configure settings and deploy

## 🔧 **Post-Deployment Configuration**

### **1. Verify Environment Variables**
After deployment, verify that all environment variables are loaded:

1. Go to your deployed app
2. Check the browser console for any environment-related errors
3. Test the NFT minting functionality

### **2. Test NFT Minting**
1. **Play a game** of Friendsweeper
2. **Complete the game** (win or lose)
3. **Click "Mint as NFT"**
4. **Connect wallet** (ensure it's on Base Sepolia)
5. **Confirm transaction**

### **3. Test Marketplace**
1. **After minting**, click "Open Marketplace"
2. **List NFT** for sale
3. **Test buying/selling** functionality
4. **Verify royalty payments**

## 🌐 **Production Considerations**

### **1. Network Configuration**
- **Testnet (Base Sepolia):** Use for testing and development
- **Mainnet (Base):** Use for production
- Update `NEXT_PUBLIC_CHAIN_ID` accordingly:
  - `84532` for Base Sepolia
  - `8453` for Base Mainnet

### **2. Security Best Practices**
- **Never expose private keys** in client-side code
- **Use environment variables** for all sensitive data
- **Enable HTTPS** (automatic with Vercel)
- **Set up proper CORS** if needed

### **3. Performance Optimization**
- **Enable caching** for static assets
- **Optimize images** using Next.js Image component
- **Use CDN** for better global performance
- **Monitor performance** with Vercel Analytics

### **4. Monitoring and Analytics**
- **Set up Vercel Analytics** for performance monitoring
- **Configure error tracking** (e.g., Sentry)
- **Monitor API usage** and costs
- **Set up alerts** for critical issues

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. Environment Variables Not Loading**
- Check Vercel dashboard for correct variable names
- Ensure variables are set for Production environment
- Redeploy after adding new variables

#### **2. Contract Interaction Fails**
- Verify contract address is correct
- Check network configuration
- Ensure wallet is on correct network

#### **3. Image Upload Issues**
- Verify Cloudflare Worker URL is correct
- Check CORS settings
- Ensure proper authentication

#### **4. Build Failures**
- Check build logs in Vercel dashboard
- Verify all dependencies are installed
- Check for TypeScript errors

### **Debug Commands:**
```bash
# Check build locally
npm run build

# Test production build
npm run start

# Check environment variables
echo $NFT_CONTRACT_ADDRESS
```

## 📊 **Deployment Checklist**

- [ ] Environment variables configured in Vercel
- [ ] Contract deployed and verified
- [ ] Cloudflare Worker configured (if using)
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active
- [ ] Performance monitoring set up
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Backup strategy in place

## 🎯 **Next Steps After Deployment**

1. **Test all functionality** thoroughly
2. **Monitor performance** and errors
3. **Set up alerts** for critical issues
4. **Plan mainnet deployment** when ready
5. **Implement additional features** as needed

---

**Happy Deploying! 🚀**
