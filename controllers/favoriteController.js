const { validationResult } = require('express-validator');
const { query } = require('../config/db');

const toggleFavorites = async (req, res, next) => {
  try {
    // checks for validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // get property_id from req body
    const { property_id } = req.body;
    // check if favorite exists for the property and user
    const favoriteResult = await query(
      `SELECT * FROM favorites WHERE user_id = $1 and property_id = $2`,
      [req.user.userId, property_id],
    );

    if (favoriteResult.rows.length > 0) {
      // Remove favorite
      await query(
        `DELETE FROM favorites 
        WHERE user_id = $1 AND property_id = $2`,
        [req.user.userId, property_id],
      );

      return res.status(200).json({
        success: true,
        message: 'Property removed from favorites',
        isFavorited: false,
      });
    } else {
      // Add to favorites
      await query(
        `INSERT INTO favorites (user_id, property_id) 
            VALUES ($1, $2)`,
        [req.user.userId, property_id],
      );

      return res.status(201).json({
        sucess: true,
        message: 'Property added to favorites',
        isFavorited: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        p.*,
        u.full_name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        f.created_at as favorited_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'image_order', pi.image_order
            ) ORDER BY pi.image_order
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) as images
       FROM favorites f
       JOIN properties p ON f.property_id = p.id
       JOIN users u ON p.owner_id = u.id
       LEFT JOIN property_images pi ON p.id = pi.property_id
       WHERE f.user_id = $1
       GROUP BY p.id, u.id, f.created_at
       ORDER BY f.created_at DESC`,
      [req.user.userId],
    );
    res.status(200).json({
      success: true,
      favorites: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleFavorites, getFavorites };
