const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const documentRoutes = require('./routes/documents');
const onboardingRoutes = require('./routes/onboarding');
const hardwareRoutes = require('./routes/hardware');
const systemRoutes = require('./routes/system');
const chatRoutes = require('./routes/chat');

const app = express();

// Security headers
app.use(helmet());

// CORS — allow frontend (Production and Dev)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost, exact matches, or any Azure hosted subdomain (SWA or ACA)
    if (allowedOrigins.indexOf(origin) !== -1 || 
        origin.endsWith('.azurestaticapps.net') || 
        origin.endsWith('.azurecontainerapps.io')) {
      return callback(null, true);
    }
    
    return callback(new Error('CORS policy violation'), false);
  },
  credentials: true,
}));


// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'OnboardIQ API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

module.exports = app;
