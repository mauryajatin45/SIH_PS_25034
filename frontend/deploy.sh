#!/bin/bash

# Vercel Deployment Script
# This script helps deploy the frontend to Vercel

echo "🚀 Starting Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Please create it from .env.example"
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Please edit .env.local with your actual values before deploying."
    read -p "Press enter when ready to continue..."
fi

echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "📋 Next steps:"
    echo "   1. Set environment variables in your Vercel project settings"
    echo "   2. Deploy your backend and ML services"
    echo "   3. Update API URLs in environment variables"
else
    echo "❌ Deployment failed. Check the logs above for details."
    exit 1
fi
