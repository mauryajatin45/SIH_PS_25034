# Vercel Deployment Guide

This guide will help you deploy the frontend React application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally using npm:
   ```bash
   npm install -g vercel
   ```

## Deployment Steps

### 1. Environment Setup

1. Copy the environment variables template:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual values:
   - Set `VITE_API_BASE_URL` to your backend API URL
   - Set `VITE_ML_API_BASE_URL` to your ML service URL
   - Configure any other required environment variables

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to your project dashboard on Vercel
   - Navigate to Settings → Environment Variables
   - Add all variables from your `.env.local` file
   - Variables starting with `VITE_` will be automatically available in your frontend

#### Option B: Using GitHub Integration

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**:
   - Add all required environment variables in the project settings
   - Make sure to include `VITE_` prefixed variables

### 3. Domain Configuration

1. **Custom Domain** (Optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS settings as instructed

2. **Subdomain**:
   - Vercel automatically provides a `*.vercel.app` subdomain
   - You can customize it in Project Settings → Domains

## Configuration Files

The following files have been created for optimal Vercel deployment:

- **`vercel.json`**: Main configuration file with routing and build settings
- **`.vercelignore`**: Specifies files to exclude from deployment
- **`.env.example`**: Template for environment variables
- **`package.json`**: Updated with Vercel deployment scripts

## Environment Variables Required

Set these in your Vercel project settings:

```env
VITE_API_BASE_URL=https://your-backend-api.vercel.app
VITE_ML_API_BASE_URL=https://your-ml-service.vercel.app
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Build Errors

1. **Check Node.js Version**:
   - Ensure you're using Node.js 18+ (specified in vercel.json)
   - Check your `package.json` engines field if needed

2. **Dependencies**:
   - Run `npm install` locally to ensure all dependencies are installed
   - Check for any peer dependency warnings

### Runtime Errors

1. **Environment Variables**:
   - Verify all required environment variables are set in Vercel
   - Check that `VITE_` prefixed variables are correctly named

2. **API Connections**:
   - Ensure backend and ML services are deployed and accessible
   - Check CORS settings on backend services

### Performance Issues

1. **Static Assets**:
   - The configuration includes caching headers for static assets
   - Check that assets are being served from CDN

2. **Bundle Size**:
   - Monitor bundle size in Vercel analytics
   - Consider code splitting for large applications

## Monitoring and Analytics

1. **Vercel Analytics**:
   - Enabled by default for performance monitoring
   - View real user metrics in your dashboard

2. **Logs**:
   - Access function logs in the Vercel dashboard
   - Use `console.log` statements for debugging

3. **Performance**:
   - Monitor Core Web Vitals in the dashboard
   - Set up performance budgets if needed

## Next Steps

After successful frontend deployment:

1. **Deploy Backend**: Set up backend on Railway, Render, or similar platform
2. **Deploy ML Service**: Deploy Python FastAPI service
3. **Database Setup**: Configure MongoDB Atlas
4. **Domain Setup**: Configure custom domains if needed
5. **Testing**: Test the complete application flow

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [vercel.com/community](https://vercel.com/community)
- **Status**: [status.vercel.com](https://status.vercel.com)
