const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { query } = require('../config/db');
const { sendResetEmail } = require('../config/email');
const { uploadToCloudinary } = require('../service/cloudinaryService');
const { validationResult } = require('express-validator');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// generate token
function generateToken(id) {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const register = async (req, res, next) => {
  try {
    // checks for validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // destruct fields from req.boby
    const { full_name, email, password, phone } = req.body;
    // checks that all fields are available
    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are mandatory.' });
    }
    // checks if user exists
    const userExists = await query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    // return error if user already exists
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    // generate salt rounds
    const salt = await bcrypt.genSalt(10);
    // hash user password
    const hash = await bcrypt.hash(password, salt);

    // Handle avatar upload if provided
    let avatarUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'avatars');
      avatarUrl = result.secure_url;
    }

    // store user in database
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, phone, avatar_url) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, email, full_name, phone, avatar_url, created_at`,
      [email, hash, full_name, phone || null, avatarUrl],
    );
    // gets new user
    const user = result.rows[0];

    res.cookie('token', generateToken(user.id), cookieOptions);

    res.status(201).json({ user, message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // get user inputs
    const { email, password } = req.body;
    // check for user inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are mandatory.' });
    }
    // query table for user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    // return error if user does not exists
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // get user if exists
    const user = result.rows[0];

    // check if user has password (i.e., not a Google login)
    if (!user.password) {
      return res.status(401).json({
        error: 'This account uses Google login. Please log in with Google.',
      });
    }

    // check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // generate token
    const token = generateToken(user.id);
    // set token in cookie
    res.cookie('token', token, cookieOptions);
    const { password: _, ...userWithoutPassword } = user; // Exclude password from response
    res.status(200).json({
      user: userWithoutPassword,
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

const googleCallback = (req, res) => {
  try {
    if (!req.user) {
      throw new Error('Google authentication failed. No user');
    }
    const token = generateToken(req.user.id);
    res.cookie('token', token, cookieOptions);
    res.redirect(`${process.env.FRONTEND_URL_DEV}?auth=success`);
    // res.status(200).json({ message: 'Google authentication successful' });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL_DEV}/login?error=auth_failed`);
    // res.status(500).json({ error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
  res.status(200).json({ message: 'Logged out successfully' });
};

const profile = async (req, res) => {
  try {
    // get userId
    const userId = req.userId;
    // get user from db
    const result = await pool.query(
      'SELECT id, username, email, phone, created_at FROM users WHERE id = $1',
      [userId],
    );
    // check user error
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// business logic for forgor password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    await pool.query(
      `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3`,
      [resetToken, resetTokenExpiry, email],
    );
    await sendResetEmail(email, resetToken);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  profile,
  googleCallback,
};
