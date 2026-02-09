const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const upload = require('../middleware/upload');
const authenticate = require('../middleware/authenticate');
const { createProperty } = require('../controllers/propertyControllers');

// Validation rules for property creation
const propertyValidationRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('type').isIn(['sale', 'rent']).withMessage('Type must be sale or rent'),
  body('property-type')
    .trim()
    .notEmpty()
    .withMessage('Property type is required.'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('bedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be positive integer'),
  body('bathrooms')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bathrooms must be a positive number'),
  body('area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Area must be a postive number'),
];

// public routes
router.get('/', (req, res) => {
  res.json({ message: 'List of properties' });
});

router.get('/:id', (req, res) => {
  const propertyId = req.params.id;
  res.json({ message: `Details of property with ID: ${propertyId}` });
});

// protected routes
router.post(
  '/',
  authenticate,
  upload.array('images', 10),
  propertyValidationRules,
  createProperty,
);

router.put('/:id', (req, res) => {
  const propertyId = req.params.id;
  res.json({ message: `Property with ID: ${propertyId} updated` });
});

router.delete('/:id', (req, res) => {
  const propertyId = req.params.id;
  res.json({ message: `Property with ID: ${propertyId} deleted` });
});

module.exports = router;
