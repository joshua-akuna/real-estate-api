const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require('passport');
const upload = require('../middleware/upload');

const authenticate = require('../middleware/authenticate');
const {
  register,
  login,
  logout,
  profile,
  googleCallback,
} = require('../controllers/authController');
const { registerValidator } = require('../middleware/validators');

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// routes
router.post('/register', upload.single('avatar'), registerValidator, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
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

// password reset route
// router.post('/forgot-password', forgotPassword);

module.exports = router;
