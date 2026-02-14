// ============================================
// PASSPORT CONFIGURATION
// Google OAuth Strategy
// ============================================
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const { query } = require('../config/db');

// ============================================
// GOOGLE OAUTH STRATEGY
// ============================================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL_DEV,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const fullName = profile.displayName;
        const avatarUrl =
          profile.photos && profile.photos.length > 0
            ? profile.photos[0].value
            : null;

        // checks if user exists with this google id
        let result = await query('SELECT * FROM users WHERE google_id = $1', [
          googleId,
        ]);

        let user;

        if (result.rows.length > 0) {
          // User exists, update avatar if change
          user = result.rows[0];

          if (user.avatar_url !== avatarUrl) {
            await query(
              'UPDATE users Set avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [avatarUrl, user.id],
            );
            user.avatar_url = avatarUrl; // Update the user object with the new avatar URL
          }
        } else {
          // Check if user exists with this email (registered via email/password)
          result = await query('SELECT * FROM users WHERE email = $1', [email]);

          if (result.rows.length > 0) {
            // User exists with this email, link Google account
            user = result.rows[0];
            await query(
              'UPDATE users SET google_id = $1, avatar_url = $2, is_verified = true updated_at = CURRENT_TIMESTAMP WHERE id = $3',
              [googleId, avatarUrl, user.id],
            );
            user.google_id = googleId; // Update the user object with the Google ID
            user.avatar_url = avatarUrl; // Update the user object with the new avatar URL
            user.is_verified = true; // Update the user object to reflect that the email is now verified
          } else {
            // User does not exist, create new user
            result = await query(
              `INSERT INTO users (email, google_id, full_name, avatar_url, is_verified) 
              VALUES ($1, $2, $3, $4, true) 
              RETURNING *`,
              [email, googleId, fullName, avatarUrl],
            );
            user = result.rows[0];
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

// ============================================
// SERIALIZE/DESERIALIZE USER
// ============================================
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    // const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return done(null, false);
    }
    done(null, user.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
