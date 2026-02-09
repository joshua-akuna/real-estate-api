const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');

const getProperties = async (req, res) => {
  try {
    const {
      type,
      city,
      state,
      country,
      min_price,
      max_price,
      bedrooms,
      property_type,
      rent_period,
      page = 1,
      limit = 10,
    } = req.query;

    let query = `
      SELECT p.*,
             u.username as owner_name,
             u.phone as owner_phone,
             json_agg(json_build_object('id', pi.id, 'image_url', pi.image_url, 'is_primary', pi.is_primary) ORDER BY pi.is_primary DESC, pi.id) as images
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN property_images pi ON p.id = pi.property_id
      WHERE p.status = 'active'
    `;

    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND p.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (city) {
      query += ` AND LOWER(p.city) = LOWER($${paramCount})`;
      params.push(city);
      paramCount++;
    }

    if (state) {
      query += ` AND LOWER(p.state) = LOWER($${paramCount})`;
      params.push(state);
      paramCount++;
    }

    if (country) {
      query += ` AND LOWER(p.country) = LOWER($${paramCount})`;
      params.push(country);
      paramCount++;
    }

    if (min_price) {
      query += ` AND p.price >= $${paramCount}`;
      params.push(min_price);
      paramCount++;
    }

    if (max_price) {
      query += ` AND p.price <= $${paramCount}`;
      params.push(max_price);
      paramCount++;
    }

    if (bedrooms) {
      query += ` AND p.bedrooms >= $${paramCount}`;
      params.push(bedrooms);
      paramCount++;
    }

    if (property_type) {
      query += ` AND LOWER(p.property_type) = LOWER($${paramCount})`;
      params.push(property_type);
      paramCount++;
    }

    if (rent_period) {
      query += ` AND LOWER(p.rent_period) = LOWER($${paramCount})`;
      params.push(rent_period);
      paramCount++;
    }

    query += ` GROUP BY p.id, u.username, u.phone ORDER BY p.created_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    // Query execution on properties table to get filtered properties
    const properties = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM properties WHERE status = 'active'`;
    // Remove limit and offset for count query
    const countParams = params.slice(0, -2);

    if (countParams.length > 0) {
      countQuery = query.split('GROUP BY')[0];
    }

    const totalResult = await pool.query(
      countQuery.replace('/SELECT.*FROM/', 'SELECT COUNT(DISTINCT p.id) FROM'),
      countParams,
    );
    res.json({
      properties: properties.rows,
      total: parseInt(totalResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(totalResult.rows[0].count / limit),
    });
  } catch (error) {
    console.error('Get Properties Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a single property by ID
const getPropertyById = async (req, res) => {
  try {
    // gets the property id from req params
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, 
              u.username as owner_name,
              u.email as owner_email,
              u.phone as owner_phone,
              json_agg(json_build_object('id', pi.id, 'image_url', pi.image_url, 'is_primary', pi.is_primary) ORDER BY pi.is_primary DESC, pi.id) as images
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN property_images pi ON p.id = pi.property_id
       WHERE p.id = $1
       GROUP BY p.id, u.username, u.email, u.phone`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get Property by ID Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new property with images upload
const createProperty = async (req, res) => {
  const client = await pool.connect();
  try {
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
                json_agg(json_build_object('id', pi.id, 'image_url', pi.image_url, 'is_primary', pi.is_primary) ORDER BY pi.is_primary DESC, pi.id) as images
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

// Delete a property by ID
const deleteProperty = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // Check if property exists and belongs to the user
    const ownership = await client.query(
      'SELECT user_id FROM properties WHERE id = $1',
      [id],
    );
    if (ownership.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Property not found' });
    }

    if (ownership.rows[0].user_id !== req.userId) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'Unauthorized to delete this property' });
    }
    // Get all images to delete from Cloudinary
    const images = await client.query(
      'SELECT cloudinary_id FROM property_images WHERE property_id = $1',
      [id],
    );
    // Delete images from Cloudinary
    const deletePromises = images.rows.map((img) =>
      cloudinary.uploader.destroy(img.cloudinary_id),
    );
    await Promise.all(deletePromises);

    // Delete property (cascade will delete images from DB)
    await client.query('DELETE FROM properties WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete Property Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  deleteProperty,
};
