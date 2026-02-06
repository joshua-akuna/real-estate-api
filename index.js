const express = require('express');
require('dotenv').config();
const cors = require('cors');
const propertiesRouter = require('./routes/propertyRoute');
const authRouter = require('./routes/authRoute');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: 'http://localhost:5173', // React frontend URL
    credentials: true, // Allow cookies
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/properties', propertiesRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
