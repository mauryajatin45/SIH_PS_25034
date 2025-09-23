// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');

async function start() {
  console.log('Current working directory:', process.cwd());
  console.log('Environment variables:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  console.log('MONGODB_URI_ML:', process.env.MONGODB_URI_ML);

  // 1) Connect DBs and WAIT
  const { mainConn, mlConn } = await connectDB();

  // 2) Build app only after DB ready
  const app = express();

  // --- CORS ---
  const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'https://sih-ps-25034.vercel.app,https://sih-ps-25034.vercel.app/')
    .split(',').map(s => s.trim());

  app.use(cors({
    origin(origin, cb) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return cb(null, true);
      
      // Allow all Vercel domains and your specific domain
      if (origin.includes('vercel.app') || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      
      // For development, allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return cb(null, true);
      }
      
      console.log(`CORS blocked for origin: ${origin}`);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
  }));

  // --- Security + logs ---
  app.use(helmet());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // --- Body parsing ---
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // --- Health ---
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      db: {
        mainReady: mainConn.readyState === 1,
        mlReady: mlConn.readyState === 1,
        mainDb: mainConn.name,
        mlDb: mlConn.name,
      }
    });
  });

  // 3) Now require routes (models inside will see global.mlConnection)
  const authRoutes = require('./routes/auth');
  const candidateRoutes = require('./routes/candidates');
  const internshipRoutes = require('./routes/internships');
  const recommendationRoutes = require('./routes/recommendations');
  const searchRoutes = require('./routes/search');
  const feedbackRoutes = require('./routes/feedback');
  const analyticsRoutes = require('./routes/analytics');

  app.use('/api/auth', authRoutes);
  app.use('/api/candidates', candidateRoutes);
  app.use('/api/internships', internshipRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // 404 + error handler...
  app.use((req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  });
  app.use((err, req, res, _next) => {
    const status = err.status || 500;
    console.error('Error:', status, err.message);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
    res.status(status).json({
      success: false,
      error: { code: status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR', message: err.message || 'Something went wrong' }
    });
  });

  const PORT = process.env.PORT || 5000;
  const HTTPS_PORT = process.env.HTTPS_PORT || 5443;
  
  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
  });

  // For production, you should set up HTTPS with proper SSL certificates
  // This is a basic setup - in production, use proper SSL certificates
  if (process.env.NODE_ENV === 'production') {
    const https = require('https');
    const fs = require('fs');
    
    // Try to load SSL certificates if they exist
    try {
      const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/private.key'),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/certificate.crt')
      };
      
      const httpsServer = https.createServer(options, app);
      httpsServer.listen(HTTPS_PORT, () => {
        console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
      });
    } catch (error) {
      console.log('HTTPS not configured - SSL certificates not found. Using HTTP only.');
      console.log('To enable HTTPS, provide SSL certificates or deploy to a service that provides HTTPS.');
    }
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  function shutdown() {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }
}

start().catch((e) => {
  console.error('Fatal boot error:', e);
  process.exit(1);
});
