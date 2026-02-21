const { validationResult } = require('express-validator');
const { query } = require('../config/db');

const sendMessage = async (req, res, next) => {
  try {
    //   checks for input errors from requests
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // get user input from request body
    const { receiver_id, property_id, subject, message } = req.body;

    // checks that receiver is not sender, can't send message to self
    if (receiver_id === req.user.userId) {
      res
        .status(400)
        .json({ message: "Unauthorised: Can't send message to user" });
    }

    // Checks if receiver exists
    const receiverCheck = await query(`SELECT id FROM users WHERE id = $1`, [
      receiver_id,
    ]);

    if (receiverCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Receiver not found' });
    }

    // Insert message
    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, property_id, subject, message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
      [req.user.userId, receiver_id, property_id || null, subject, message],
    );

    res
      .status(201)
      .json({ message: 'Message sent successfully', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage };
