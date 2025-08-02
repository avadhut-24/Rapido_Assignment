const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUserUpdate, validateIdParam } = require('../middleware/validation');
const { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  getUserById, 
  getAllUsers 
} = require('../controllers/userController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user profile
router.get('/profile', getUserProfile);

// Update user profile
router.put('/profile', validateUserUpdate, updateUserProfile);

// Change password
router.put('/change-password', changePassword);

// Get user by ID (admin only)
router.get('/:id', validateIdParam, requireAdmin, getUserById);

// Get all users (admin only)
router.get('/', requireAdmin, getAllUsers);

module.exports = router; 