const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { register, login, getCurrentUser } = require('../controllers/authController');

const router = express.Router();

// Register new user
router.post('/register', validateUserRegistration, register);

// Login user
router.post('/login', validateUserLogin, login);

// Get current user profile
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router; 