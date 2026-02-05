const express = require('express');
require('dotenv').config();
const propertiesRouter = require('./routes/propertyRoute');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api/v1/properties', propertiesRouter);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
