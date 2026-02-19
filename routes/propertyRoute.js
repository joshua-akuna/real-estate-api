const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const upload = require('../middleware/upload');
const authenticate = require('../middleware/authenticate');
const {
  getProperties,
  createProperty,
  updateProperty,
  getPropertyById,
  deleteProperty,
} = require('../controllers/propertyControllers');
const {
  creatPropertyValidators,
  updatePropertyValidator,
  deletePropertyValidator,
} = require('../middleware/validators');

// public routes
router.get('/', getProperties);
router.get('/:id', getPropertyById);

// protected routes
router.post(
  '/',
  authenticate,
  upload.array('images', 10),
  creatPropertyValidators,
  createProperty,
);
router.put('/:id', authenticate, updatePropertyValidator, updateProperty);
router.delete('/:id', authenticate, deletePropertyValidator, deleteProperty);

module.exports = router;
