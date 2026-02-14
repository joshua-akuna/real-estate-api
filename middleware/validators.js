const { body } = require('express-validator');

// Validation rules
const registerValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number required'),
];

module.exports = { registerValidator };
