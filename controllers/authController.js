const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// generate token
function generateToken(id) {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const register = async (req, res) => {
  try {
    // destruct fields from req.boby
    const { name, email, password, phone } = req.body;
    // checks that all fields are available
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are mandatory.' });
    }
    // checks if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    // return error if user already exists
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    // generate salt rounds
    const salt = await bcrypt.genSalt(10);
    // hash user password
    const hash = await bcrypt.hash(password, salt);
    // store user in database
    const result = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, created_at',
      [name, email, hash, phone],
    );
    // gets new user
    const user = result.rows[0];

    res.cookie('token', generateToken(user.id), cookieOptions);

    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    // get user inputs
    const { email, password } = req.body;
    // check for user inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are mandatory.' });
    }
    // query table for user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    // return error if user does not exists
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // get user if exists
    const user = result.rows[0];
    // check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken(user.id);
    res.cookie('token', token, cookieOptions);
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { register, login, logout };
