const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const propertiesRouter = require('./routes/propertyRoute');
const authRouter = require('./routes/authRoute');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // React frontend URL
    credentials: true, // Allow cookies
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/properties', propertiesRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
