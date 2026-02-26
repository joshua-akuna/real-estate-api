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
      return res
        .status(400)
        .json({ message: "Unauthorised: Can't send message to self" });
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

const getInbox = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
          m.*,
          sender.full_name as sender_name, 
          sender.email as sender_email, 
          sender.avatar_url as sender_avatar, 
          p.title as property_title 
        FROM messages m 
        JOIN users sender ON m.sender_id = sender.id 
        LEFT JOIN properties p ON m.property_id = p.id 
        WHERE m.receiver_id = $1 
        ORDER BY m.created_at DESC`,
      [req.user.userId],
    );
    // sends a response
    res.status(200).json({
      success: true,
      profile_id: req.user.userId,
      messages: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const getSentMessages = async (req, res, next) => {
  try {
    // queries the database
    const result = await query(
      `SELECT 
        m.*,
        receiver.full_name as receiver_name,
        receiver.email as receiver_email,
        receiver.avatar_url as receiver_avatar,
        p.title as property_title
       FROM messages m
       JOIN users receiver ON m.receiver_id = receiver.id
       LEFT JOIN properties p ON m.property_id = p.id
       WHERE m.sender_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.userId],
    );
    // sends a response
    res.status(200).json({ success: true, messages: result.rows });
  } catch (error) {
    next(error);
  }
};

// get message thread between users
const getMessageThread = async (req, res, next) => {
  try {
    // get the user id as a param
    const { user_id } = req.params;
    // query the database fot message thread
    const result = await query(
      `SELECT 
        m.*,
        sender.full_name as sender_name,
        sender.avatar_url as sender_avatar,
        receiver.full_name as receiver_name,
        receiver.avatar_url as receiver_avatar,
        p.title as property_title
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       JOIN users receiver ON m.receiver_id = receiver.id
       LEFT JOIN properties p ON m.property_id = p.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [req.user.userId, user_id],
    );
    res.json({ success: true, messages: result.rows });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    // get id from req params
    const { id } = req.params;
    // check if message exists and current user is receiver
    const checkResult = await query(
      `SELECT * FROM messages 
      WHERE id = $1 AND receiver_id = $2`,
      [id, req.user.userId],
    );
    // checks for message
    if (checkResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, messsage: 'Message not found' });
    }
    await query(`UPDATE messages SET is_read = TRUE WHERE id = $1`, [id]);
    res.json(201).json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

// gets the number of unread messages for user
const getUnreadCount = async (req, res, next) => {
  try {
    // query the number of unread message for a recipient
    const result = await query(
      `SELECT COUNT(*) FROM messages 
      WHERE receiver_id = $1 AND is_read = FALSE`,
      [req.user.userId],
    );
    res
      .status(200)
      .json({ success: true, unreadCount: parseInt(result.rows[0].count) });
  } catch (error) {}
};

module.exports = {
  sendMessage,
  getInbox,
  getSentMessages,
  getMessageThread,
  markAsRead,
  getUnreadCount,
};
