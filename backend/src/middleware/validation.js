const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('company').optional().trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('company').optional().trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  handleValidationErrors
];

// Ride validation rules
const validateRideCreation = [
  body('pickupLocation').trim().isLength({ min: 5 }).withMessage('Pickup location must be at least 5 characters'),
  body('dropLocation').trim().isLength({ min: 5 }).withMessage('Drop location must be at least 5 characters'),
  body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required'),
  body('purpose').optional().trim().isLength({ min: 5 }).withMessage('Purpose must be at least 5 characters'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors
];

const validateRideUpdate = [
  body('pickupLocation').optional().trim().isLength({ min: 5 }).withMessage('Pickup location must be at least 5 characters'),
  body('dropLocation').optional().trim().isLength({ min: 5 }).withMessage('Drop location must be at least 5 characters'),
  body('scheduledTime').optional().isISO8601().withMessage('Valid scheduled time is required'),
  body('purpose').optional().trim().isLength({ min: 5 }).withMessage('Purpose must be at least 5 characters'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors
];

// Admin validation rules
const validateRideAction = [
  body('action').isIn(['APPROVE', 'REJECT', 'CANCEL']).withMessage('Valid action is required'),
  body('reason').optional().trim().isLength({ min: 5 }).withMessage('Reason must be at least 5 characters'),
  handleValidationErrors
];

// Query validation rules
const validateRideFilters = [
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']).withMessage('Valid status is required'),
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  query('userId').optional().isUUID().withMessage('Valid user ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Parameter validation rules
const validateIdParam = [
  param('id').matches(/^c[a-z0-9]{24}$/).withMessage('Valid CUID is required'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateRideCreation,
  validateRideUpdate,
  validateRideAction,
  validateRideFilters,
  validateIdParam,
  handleValidationErrors
}; 