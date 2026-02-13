// ============================================
// AUTHENTICATION MIDDLEWARE
// JWT Token Verification from HTTP-only Cookies
// Authenticate middleware to protect routes
// ============================================
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { query } = require('../config/db');

/**
 * Verify JWT token from HTTP-only cookie
 * Attaches user data to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Exract JWT token from HTTP-only cookies
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Unauthorized. No token provided' });
    }
    // verify token and extract userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Get user from database
    const result = await query(
      `SELECT id, email, full_name, avatar_url, role, is_verified 
      FROM users 
      WHERE id = $1`,
      [decoded.userId],
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token. User not found' });
    }
    // attach user to request object for use in protected routes
    req.user = result.rows[0];

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

module.exports = authenticate;
