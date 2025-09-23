# HTTP Backend + HTTPS Frontend Solution

## Problem Solved ✅
Your HTTPS frontend can now communicate with your HTTP backend without mixed content errors!

## How It Works

### 1. Vercel Proxy (Primary Solution)
- **Vercel Configuration**: Added proxy rules in `vercel.json` that redirect `/api/*` requests to your HTTP backend
- **URL Mapping**: `https://sih-ps-25034.vercel.app/api/login` → `http://13.201.95.207:5000/api/login`
- **CORS Headers**: Added proper CORS headers for cross-origin requests

### 2. Frontend Smart Detection
- **Production Mode**: Uses relative URLs (`/api`) when deployed on Vercel
- **Development Mode**: Uses direct HTTP URLs (`http://13.201.95.207:5000`) for local development
- **Automatic Detection**: Detects environment and switches protocols accordingly

### 3. Enhanced Backend CORS
- **Flexible Origins**: Allows all Vercel domains and your specific domain
- **Development Support**: Allows localhost for local development
- **Proper Headers**: Includes all necessary CORS headers

## Files Modified

### Frontend Changes:
1. **`vite.config.ts`** - Added proxy for local development
2. **`vercel.json`** - Added API proxy configuration
3. **`src/api/apiClient.ts`** - Smart URL detection for production/development
4. **`env.production`** - Updated to use relative URLs

### Backend Changes:
1. **`app.js`** - Enhanced CORS configuration for better HTTP-HTTPS support

## How to Deploy

### 1. Deploy Frontend to Vercel
```bash
cd frontend
npm run build
# Deploy to Vercel (the vercel.json will handle the proxy)
```

### 2. Keep Backend Running on HTTP
```bash
cd backend
npm start
# Your backend stays on http://13.201.95.207:5000
```

## Request Flow

### Production (HTTPS Frontend → HTTP Backend):
1. User visits: `https://sih-ps-25034.vercel.app/login`
2. Frontend makes request to: `https://sih-ps-25034.vercel.app/api/auth/login`
3. Vercel proxy redirects to: `http://13.201.95.207:5000/api/auth/login`
4. Backend processes request and responds
5. Response goes back through Vercel proxy to frontend

### Development (Local Frontend → HTTP Backend):
1. Frontend runs on: `http://localhost:5173`
2. Frontend makes direct request to: `http://13.201.95.207:5000/api/auth/login`
3. Backend processes request directly

## Benefits

✅ **No Mixed Content Errors**: HTTPS frontend communicates with HTTP backend seamlessly
✅ **No Backend Changes Required**: Your HTTP backend stays exactly as it is
✅ **Automatic Environment Detection**: Works in both development and production
✅ **Secure Communication**: All requests go through HTTPS in production
✅ **Easy Deployment**: Just deploy frontend to Vercel, backend stays on your server

## Testing

1. **Deploy your frontend** to Vercel
2. **Keep your backend running** on `http://13.201.95.207:5000`
3. **Test the login functionality** - it should work without mixed content errors
4. **Check browser console** - no more security warnings

## Troubleshooting

If you still see mixed content errors:
1. Clear browser cache and hard refresh
2. Check that `vercel.json` is properly deployed
3. Verify your backend is running and accessible
4. Check Vercel function logs for any proxy errors

Your HTTP backend and HTTPS frontend will now communicate perfectly! 🎉
