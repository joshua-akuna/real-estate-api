const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const passport = require('./config/passport');
// const passport = require('passport');

const propertiesRouter = require('./routes/propertyRoute');
const authRouter = require('./routes/authRoute');

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

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/properties', propertiesRouter);

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'Real Estate API', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
