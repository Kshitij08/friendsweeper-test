#!/bin/bash

echo "🚀 Friendsweeper Cloudflare Setup Script"
echo "========================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
else
    echo "✅ Wrangler CLI found"
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare..."
    wrangler login
else
    echo "✅ Already logged in to Cloudflare"
fi

# Create cloudflare-worker directory if it doesn't exist
if [ ! -d "_cloudflare-worker" ]; then
    echo "📁 Creating _cloudflare-worker directory..."
    mkdir -p _cloudflare-worker/src
fi

echo ""
echo "📋 Next Steps:"
echo "1. Update _cloudflare-worker/wrangler.jsonc with your Account ID"
echo "2. Run: cd _cloudflare-worker && npm install"
echo "3. Run: npm run deploy"
echo "4. Update your .env.local with the worker URL"
echo ""
echo "📚 See CLOUDFLARE_DEPLOYMENT.md for detailed instructions"
