const express = require('express');
const {
  toggleFavorites,
  getFavorites,
  checkFavorite,
} = require('../controllers/favoriteController');
const {
  toggleFavoriteValidator,
  isFavoriteValidator,
} = require('../middleware/validators');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/toggle', authenticate, toggleFavoriteValidator, toggleFavorites);
router.get('/', authenticate, getFavorites);
router.get(
  '/check/:property_id',
  isFavoriteValidator,
  authenticate,
  checkFavorite,
);

module.exports = router;
