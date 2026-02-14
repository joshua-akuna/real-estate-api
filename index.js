const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const passport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoute');
const propertyRoutes = require('./routes/propertyRoute');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL_DEV || 'http://localhost:5173', // React frontend URL
    credentials: true, // Allow cookies
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false, // set to false to allow client-side access for testing; change to true in production
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/properties', propertyRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'Real Estate API', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
