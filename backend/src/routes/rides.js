const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateRideCreation, validateRideUpdate, validateIdParam } = require('../middleware/validation');
const { 
  createRide, 
  getUserRides, 
  getRideById, 
  updateRide, 
  cancelRide 
} = require('../controllers/rideController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new ride request
router.post('/', validateRideCreation, createRide);

// Get all rides for the authenticated user
router.get('/my-rides', getUserRides);

// Get ride details by ID
router.get('/:id', validateIdParam, getRideById);

// Update a ride (only if pending)
router.put('/:id', validateIdParam, validateRideUpdate, updateRide);

// Cancel a ride
router.delete('/:id', validateIdParam, cancelRide);

module.exports = router; 