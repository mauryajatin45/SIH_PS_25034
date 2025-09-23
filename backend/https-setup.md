# HTTPS Setup Guide for Backend

## Problem
Your frontend is deployed on HTTPS (https://sih-ps-25034.vercel.app) but your backend is running on HTTP (http://13.201.95.207:5000). This causes a "Mixed Content" error that browsers block for security reasons.

## Solutions

### Option 1: Deploy Backend to HTTPS-enabled Service (RECOMMENDED)

#### Railway (Free tier available)
1. Go to https://railway.app
2. Connect your GitHub repository
3. Select the backend folder
4. Railway will automatically provide HTTPS
5. Update your frontend to use the new HTTPS URL

#### Render (Free tier available)
1. Go to https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Select the backend folder
5. Render will automatically provide HTTPS

#### Heroku (Free tier discontinued, but paid options available)
1. Go to https://heroku.com
2. Create a new app
3. Connect your GitHub repository
4. Deploy the backend
5. Heroku provides HTTPS by default

### Option 2: Use a Reverse Proxy (Advanced)

#### Nginx with SSL
1. Set up Nginx on your server
2. Obtain SSL certificates (Let's Encrypt)
3. Configure Nginx to proxy requests to your backend
4. Update DNS to point to the Nginx server

### Option 3: Use Cloudflare (Quick Fix)

1. Add your domain to Cloudflare
2. Enable "Always Use HTTPS"
3. Set up a Page Rule to proxy your API requests
4. This will make HTTP requests appear as HTTPS to browsers

## Environment Variables

After deploying to an HTTPS service, update your frontend environment variables:

```env
VITE_PREFIX_URL=https://your-new-backend-url.com/api
```

## Testing

After implementing any solution:
1. Check that your backend responds to HTTPS requests
2. Test the frontend login functionality
3. Verify that no mixed content errors appear in browser console

## Current Status

- ✅ Frontend updated to use HTTPS URLs
- ✅ CSP header added to force HTTPS upgrade
- ✅ Backend configured to support HTTPS (when certificates are available)
- ⏳ Backend needs to be deployed to HTTPS-enabled service
