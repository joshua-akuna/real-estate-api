// Authenticate middleware to protect routes
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  try {
    // Exract JWT token from HTTP-only cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // verify token and extract userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach userId to request object for use in protected routes
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = authenticate;
