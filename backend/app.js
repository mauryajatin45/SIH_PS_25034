require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

// --- DB ---
connectDB().catch((err) => {
  console.error('Mongo connection error:', err);
  process.exit(1);
});

// --- CORS ---
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin(origin, cb) {
    // allow mobile apps / curl / server-to-server (no origin)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// --- Security + logs ---
app.use(helmet());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- Body parsing ---
app.use(express.json({ limit: '1mb' })); // bump if you expect larger payloads
app.use(express.urlencoded({ extended: true }));

// --- Static (optional: if you later store files) ---
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health ---
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// --- Routes ---
const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');
const internshipRoutes = require('./routes/internships');
const recommendationRoutes = require('./routes/recommendations');
const searchRoutes = require('./routes/search');
const feedbackRoutes = require('./routes/feedback');
const analyticsRoutes = require('./routes/analytics');

console.log('Auth routes loaded:', !!authRoutes);
console.log('Candidate routes loaded:', !!candidateRoutes);
console.log('Internship routes loaded:', !!internshipRoutes);
console.log('Recommendation routes loaded:', !!recommendationRoutes);
console.log('Search routes loaded:', !!searchRoutes);
console.log('Feedback routes loaded:', !!feedbackRoutes);
console.log('Analytics routes loaded:', !!analyticsRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- Debug all registered routes (dev only) ---
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route?.path) {
      routes.push({ path: m.route.path, methods: Object.keys(m.route.methods) });
    } else if (m.name === 'router' && m.handle?.stack) {
      const base = m.regexp?.toString?.() || '';
      const basePath = base
        .replace(/^\/\^\\\//, '/')
        .replace(/\\\/\?\(\?=\\\/\|\$\)\/i$/, '')
        .replace(/\\\//g, '/')
        .replace(/\^/g, '')
        .replace(/\$/g, '')
        .replace(/\/\?\(\?=\/\|\$\)/, '')
        .replace(/\\/g, '');
      m.handle.stack.forEach((h) => {
        if (h.route?.path) {
          routes.push({
            path: `${basePath}${h.route.path}`.replace(/\/{2,}/g, '/'),
            methods: Object.keys(h.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
});

// --- Error handler ---
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  console.error('Error:', status, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(status).json({
    success: false,
    error: { code: status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR', message: err.message || 'Something went wrong' }
  });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// --- Graceful shutdown ---
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
async function shutdown() {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

module.exports = app;
