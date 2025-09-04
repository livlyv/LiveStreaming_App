const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import Supabase and helper functions
const { supabaseAdmin } = require('./config/database');
const { getOrCreateUserFromSupabase } = require('./routes/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const streamingRoutes = require('./routes/streaming');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const mediaRoutes = require('./routes/media');

const { BACKEND_HOST, BACKEND_PORT } = require('../../lib/config.js');

const app = express();
const PORT = BACKEND_PORT;
const HOST = BACKEND_HOST;

// Trust proxy for ngrok and load balancers (more secure)
app.set('trust proxy', 'loopback, 127.0.0.1, ::1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12');

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:8082',
      'exp://localhost:8081',
      'exp://localhost:8082',
      'https://dev-bo44fwxvov01657rf6ttq.rorktest.dev'
    ];
    
    // Allow ngrok URLs (they change frequently)
    if (origin.includes('ngrok-free.app') || origin.includes('ngrok.io')) {
      return callback(null, true);
    }
    
    // Allow local network IPs
    if (origin.includes('192.168.') || origin.includes('10.0.') || origin.includes('172.')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if available, otherwise use IP
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Request logging middleware
app.use('*', (req, res, next) => {
  const start = Date.now();
  console.log(`🌐 ${req.method} ${req.url}`);
  console.log(`📍 Headers:`, req.headers);
  
  res.on('finish', () => {
    const end = Date.now();
    console.log(`✅ ${req.method} ${req.url} - ${res.statusCode} - ${end - start}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check endpoint called');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase: {
      url: process.env.SUPABASE_URL ? 'configured' : 'missing',
      anon_key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
    },
    jwt_secret: process.env.JWT_SECRET ? 'configured' : 'missing'
  });
});

// OAuth callback endpoint (accessible without /api prefix)
app.get('/auth/callback', async (req, res) => {
  console.log('🔄 OAuth callback received at root level');
  console.log('📝 Query params:', req.query);
  
  const { error, code, state } = req.query;
  
  if (error) {
    console.error('❌ OAuth error:', error);
    return res.status(400).json({ error: 'OAuth authentication failed' });
  }
  
  // Handle authorization code flow (Supabase OAuth)
  if (code) {
    console.log('✅ Authorization code received:', code.substring(0, 20) + '...');
    console.log('🔍 State parameter:', state ? 'Present' : 'Missing');
    
    try {
      // Exchange the authorization code for Supabase session
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('❌ Session exchange error:', sessionError);
        return res.status(400).json({ error: 'Failed to exchange code for session' });
      }
      
      if (!sessionData.session) {
        console.error('❌ No session received from Supabase');
        return res.status(400).json({ error: 'No session received' });
      }
      
      console.log('✅ Supabase session created successfully');
      
      // Get or create user in our database
      const user = await getOrCreateUserFromSupabase(sessionData.session.user);
      
      if (!user) {
        console.error('❌ Failed to create/get user from database');
        return res.status(500).json({ error: 'Failed to process user data' });
      }
      
      console.log('✅ User processed successfully:', user.email);
      
      // Generate custom JWT tokens for our backend
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Redirect to Expo app with tokens
      const redirectUrl = `exp://localhost:8081?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
      
      console.log('🔄 Redirecting to Expo app with tokens:', redirectUrl);
      
      return res.redirect(302, redirectUrl);
      
    } catch (error) {
      console.error('❌ Error processing OAuth callback:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  console.error('❌ No authorization code received');
  return res.status(400).json({ error: 'No authorization code received' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/streaming', streamingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);

// Root endpoint
app.get('/', (req, res) => {
  console.log('🚀 Root endpoint called');
  res.json({
    status: 'ok',
    message: 'Live Streaming API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      streaming: '/api/streaming',
      payments: '/api/payments',
      notifications: '/api/notifications',
      media: '/api/media',
      health: '/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    available_endpoints: [
      '/api/auth',
      '/api/users',
      '/api/streaming',
      '/api/payments',
      '/api/notifications',
      '/api/media',
      '/health'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📚 API Base URL: http://${HOST}:${PORT}/api`);
});

module.exports = app;
