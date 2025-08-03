const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateIdParam } = require('../middleware/validation');
const { 
  simulateRideCompletion,
  getRidesEligibleForCompletion,
  bulkSimulateRideCompletion
} = require('../controllers/simulationController');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get rides eligible for completion simulation
router.get('/rides/eligible-for-completion', getRidesEligibleForCompletion);

// Simulate completion of a single ride
router.post('/rides/:rideId/complete', validateIdParam, simulateRideCompletion);

// Bulk simulate completion of multiple rides
router.post('/rides/bulk-complete', bulkSimulateRideCompletion);

module.exports = router; 