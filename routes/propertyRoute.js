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
  getUserProperties,
} = require('../controllers/propertyControllers');
const {
  creatPropertyValidators,
  updatePropertyValidator,
  deletePropertyValidator,
  paginationValidator,
  getPropertyValidator,
} = require('../middleware/validators');

// protected routes
router.get('/my-properties', authenticate, getUserProperties);
router.post(
  '/',
  authenticate,
  upload.array('images', 10),
  creatPropertyValidators,
  createProperty,
);
router.put('/:id', authenticate, updatePropertyValidator, updateProperty);
router.delete('/:id', authenticate, deletePropertyValidator, deleteProperty);

// public routes
router.get('/', paginationValidator, getProperties);
router.get('/:id', getPropertyValidator, getPropertyById);

module.exports = router;
