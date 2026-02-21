const express = require('express');
const {
  toggleFavorites,
  getFavorites,
} = require('../controllers/favoriteController');
const { toggleFavoriteValidator } = require('../middleware/validators');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/toggle', authenticate, toggleFavoriteValidator, toggleFavorites);
router.get('/', authenticate, getFavorites);

module.exports = router;
