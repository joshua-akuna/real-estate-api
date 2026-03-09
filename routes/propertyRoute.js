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
  getPropertyForEdit,
  deletePropertyImage,
  updatePropertyImages,
} = require('../controllers/propertyControllers');
const {
  creatPropertyValidators,
  updatePropertyValidator,
  deletePropertyValidator,
  paginationValidator,
  getPropertyValidator,
  deletePropertyImageValidator,
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
// update a single property
router.put('/:id', authenticate, updatePropertyValidator, updateProperty);
// deletes a single image for a property
router.delete(
  '/:id/images/:imageId',
  authenticate,
  deletePropertyImageValidator,
  deletePropertyImage,
);
// delete a single property
router.delete('/:id', authenticate, deletePropertyValidator, deleteProperty);
router.get('/:id/edit', authenticate, getPropertyValidator, getPropertyForEdit);
// Update property images
router.put(
  '/:id/images',
  authenticate,
  upload.array('images', 10),
  getPropertyValidator,
  updatePropertyImages,
);

// public routes
// get all properties
router.get('/', paginationValidator, getProperties);
// get information for a single property
router.get('/:id', getPropertyValidator, getPropertyById);

module.exports = router;
