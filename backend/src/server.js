const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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

// Trust proxy for ngrok and load balancers
app.set('trust proxy', true);

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
  message: 'Too many requests from this IP, please try again later.'
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
