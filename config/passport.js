const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../config/db');
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL_DEV,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // checks if user exists
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE google_id = $1',
          [profile.id],
        );

        // if user exists
        if (existingUser.rows.length > 0) {
          return done(null, existingUser.rows[0]);
        }

        const emailExists = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [profile.emails[0].value],
        );

        if (emailExists.rows.length > 0) {
          // update google_id for existing user
          const updatedUser = await pool.query(
            'UPDATE users SET google_id = $1, profile_picture = $2 WHERE email = $3 RETURNING *',
            [profile.id, profile.photos[0]?.value, profile.emails[0].value],
          );
          return done(null, updatedUser.rows[0]);
        }

        // if user doesn't exist, create new user
        const newUser = await pool.query(
          `INSERT INTO users (username, email, google_id, profile_picture) VALUES ($1, $2, $3, $4) RETURNING *`,
          [
            profile.displayName || profile.emails[0].value.split('@')[0],
            profile.emails[0].value,
            profile.id,
            profile.photos[0]?.value,
          ],
        );

        return done(null, newUser.rows[0]);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, user.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
