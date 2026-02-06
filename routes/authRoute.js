const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are mandatory.' });
    }
    res.status(201).json({ name, email, password, phone });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
