const express = require('express');
require('dotenv').config();
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'List of properties' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Property created' });
});

router.get('/:id', (req, res) => {
  const propertyId = req.params.id;
  res.json({ message: `Details of property with ID: ${propertyId}` });
});

router.put('/:id', (req, res) => {
  const propertyId = req.params.id;
  res.json({ message: `Property with ID: ${propertyId} updated` });
});

router.delete('/:id', (req, res) => {
  const propertyId = req.params.id;
  res.json({ message: `Property with ID: ${propertyId} deleted` });
});

module.exports = router;
