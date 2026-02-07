const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
  register,
  login,
  logout,
  profile,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/profile', authenticate, profile);
module.exports = router;
