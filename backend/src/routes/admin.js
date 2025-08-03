const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRideAction, validateRideFilters, validateAnalyticsFilters, validateIdParam } = require('../middleware/validation');
const { 
  getAllRides, 
  approveRejectRide, 
  getAnalytics, 
  getDashboard 
} = require('../controllers/adminController');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all rides in system with filters
router.get('/rides', validateRideFilters, getAllRides);

// Approve or reject a ride
router.post('/rides/:id/action', validateIdParam, validateRideAction, approveRejectRide);

// Get ride analytics
router.get('/analytics', validateAnalyticsFilters, getAnalytics);

// Get dashboard statistics
router.get('/dashboard', getDashboard);

module.exports = router; 