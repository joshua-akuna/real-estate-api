const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');

const createProperty = async (req, res) => {
  try {
    const client = await pool.connect();

    // check express validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // extract inputs from req body
    const {
      title,
      description,
      type, // sale or rent
      property_type, // house, apartment, condo, land, commercial
      price,
      rent_period, // if type is rent, specify rent period (e.g., daily, weekly monthly, yearly)
      address,
      city,
      state,
      zip_code,
      country,
      bedrooms,
      bathrooms,
      area,
    } = req.body;

    // Validate rent_period if type is rent
    if (type === 'rent' && !rent_period) {
      return res
        .status(400)
        .json({ error: 'Rent period is required for rental properties' });
    }

    if (
      type === 'rent' &&
      !['day', 'week', 'month', 'year'].includes(rent_period)
    ) {
      return res.status(400).json({
        error: 'Rent period must be one of: day, week, month, year',
      });
    }

    if (type === 'sale' && rent_period) {
      return res.status(400).json({
        error: 'Rent period should not be provided for sale properties',
      });
    }

    // start the transanction
    await client.query('BEGIN');

    // run insert query for property
    const result = await client.query(
      `INSERT INTO properties (user_id, title, description, type, property_type, price, rent_period, address, city, state, zip_code, country, bedrooms, bathrooms, area) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING *`,
      [
        req.userId,
        title,
        description,
        type,
        property_type,
        price,
        type === 'rent' ? rent_period : null,
        address,
        city,
        state,
        zip_code,
        country,
        bedrooms,
        bathrooms,
        area,
      ],
    );
    // gets newly inserted property
    const property = result.rows[0];

    // Upload images to Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file, index) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'real-estate',
              resource_type: 'image',
            },
            async (error, result) => {
              if (error) {
                reject(error);
              } else {
                try {
                  await client.query(
                    'INSERT INTO property_images (property_id, image_url, cloudinary_id, is_primary) VALUES ($1, $2, $3, $4)',
                    [
                      property.id,
                      result.secure_url,
                      result.public_id,
                      index === 0,
                    ],
                  );
                  resolve(result);
                } catch (dbError) {
                  reject(dbError);
                }
              }
            },
          );
          uploadStream.end(file.buffer);
        });
      });
      await Promise.all(uploadPromises);
    }

    await client.query('COMMIT');

    // Fetch the complete property with images to return in response
    const completeProperty = await pool.query(
      `SELECT p.*,
              json_agg(json_build_object('id', pi.id, 'image_url', pi.image_url, 'is_primary', pi.is_primary)) ORDER BY pi.is_primary DESC, pi.id) as images
       FROM properties p
       LEFT JOIN property_images pi ON p.id = pi.property_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [property.id],
    );

    res.status(201).json({
      message: 'Property created successfully',
      property: completeProperty.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create Property Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = { createProperty };
