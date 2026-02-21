const { body, param, query } = require('express-validator');

// User validation rules
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

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Property validation rules
const creatPropertyValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('property_type')
    .trim()
    .notEmpty()
    .isIn(['house', 'apartment', 'condo', 'townhouse', 'land'])
    .withMessage(
      'Property type must be house, apartment, condo, townhouse or land',
    ),
  body('listing_type')
    .isIn(['sale', 'rent'])
    .withMessage('Listing type must be sale or rent'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('rental_period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Rental period must be day, week, month or year'),
  body('bedrooms')
    .notEmpty()
    .withMessage('Number of bedrooms is required')
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be positive integer'),
  body('bathrooms')
    .notEmpty()
    .withMessage('Number of bathrooms is required')
    .isFloat({ min: 0 })
    .withMessage('Bathrooms must be a positive number'),
  body('area_sqft')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Area must be a postive number'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zip_code').optional(),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('latitude').optional().isFloat().withMessage('Invalid latitude'),
  body('longitude').optional().isFloat().withMessage('Invalid longitude'),
];

const updatePropertyValidator = [
  param('id').isUUID().withMessage('Invalid property ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('property_type')
    .optional()
    .isIn(['house', 'apartment', 'condo', 'townhouse', 'land'])
    .withMessage('Invalid property type'),
  body('listing_type')
    .optional()
    .isIn(['sale', 'rent'])
    .withMessage('Invalid listing type'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('rental_period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Invalid rental period'),
];

const deletePropertyValidator = [
  param('id').isUUID().withMessage('Invalid property ID'),
];

const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const getPropertyValidator = [
  param('id').isUUID().withMessage('Invalid property ID'),
];

const toggleFavoriteValidator = [
  body('property_id').isUUID().withMessage('Invalid property ID'),
];

module.exports = {
  registerValidator,
  loginValidator,
  creatPropertyValidators,
  updatePropertyValidator,
  deletePropertyValidator,
  paginationValidator,
  getPropertyValidator,
  toggleFavoriteValidator,
};
