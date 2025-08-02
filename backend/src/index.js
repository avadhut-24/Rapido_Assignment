const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rideRoutes = require('./routes/rides');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Corporate Ride Scheduling System is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Corporate Ride Scheduling System API',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      auth: {
        description: 'Authentication endpoints',
        routes: {
          'POST /auth/register': 'Register a new user',
          'POST /auth/login': 'Login user',
          'GET /auth/me': 'Get current user profile'
        }
      },
      users: {
        description: 'User management endpoints',
        routes: {
          'GET /users/profile': 'Get user profile',
          'PUT /users/profile': 'Update user profile',
          'PUT /users/change-password': 'Change user password',
          'GET /users/:id': 'Get user by ID',
          'GET /users': 'Get all users (admin only)'
        }
      },
      rides: {
        description: 'Ride booking endpoints',
        routes: {
          'POST /rides': 'Create a new ride request',
          'GET /rides/my-rides': 'Get user\'s rides',
          'GET /rides/:id': 'Get ride details',
          'PUT /rides/:id': 'Update ride',
          'DELETE /rides/:id': 'Cancel ride'
        }
      },
      admin: {
        description: 'Admin management endpoints',
        routes: {
          'GET /admin/rides': 'View all rides with filters',
          'POST /admin/rides/:id/action': 'Approve/reject ride',
          'GET /admin/analytics': 'Get ride analytics',
          'GET /admin/dashboard': 'Get dashboard statistics'
        }
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    examples: {
      register: {
        url: 'POST /api/auth/register',
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '+1234567890',
          department: 'Engineering'
        }
      },
      createRide: {
        url: 'POST /api/rides',
        headers: {
          'Authorization': 'Bearer <your-jwt-token>'
        },
        body: {
          pickupLocation: 'Office Building A',
          dropoffLocation: 'Airport Terminal 1',
          scheduledTime: '2024-01-15T10:00:00Z',
          purpose: 'Client Meeting',
          notes: 'Need to arrive 30 minutes early'
        }
      }
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚗 Corporate Ride Scheduling System running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
});

module.exports = app; 