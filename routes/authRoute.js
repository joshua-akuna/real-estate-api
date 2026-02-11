const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require('passport');

const {
  register,
  login,
  logout,
  profile,
  googleCallback,
} = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters long'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/logout', logout);
router.get('/profile', authenticate, profile);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL_DEV}/login?error=auth_failed`,
    session: false,
  }),
  googleCallback,
);

module.exports = router;
