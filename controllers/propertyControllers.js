const { pool, query } = require('../config/db');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const {
  upLoadMultipleImgages,
  deleteFromCloudinary,
} = require('../service/cloudinaryService');

const getProperties = async (req, res, next) => {
  try {
    // check express validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { listing_type, property_type, city, min_price, max_price, status } =
      req.query;

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (listing_type) {
      whereConditions.push(`p.listing_type = $${paramCount}`);
      queryParams.push(listing_type);
      paramCount++;
    }

    if (property_type) {
      whereConditions.push(`p.property_type = $${paramCount}`);
      queryParams.push(property_type);
      paramCount++;
    }

    if (city) {
      whereConditions.push(`LOWER(p.city) = LOWER($${paramCount})`);
      queryParams.push(city);
      paramCount++;
    }

    if (min_price) {
      whereConditions.push(`p.price >= $${paramCount}`);
      queryParams.push(min_price);
      paramCount++;
    }

    if (max_price) {
      whereConditions.push(`p.price <= $${paramCount}`);
      queryParams.push(max_price);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`p.status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM properties p ${whereClause}`,
      queryParams,
    );
    const totalProperties = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalProperties / limit);

    // Get properties
    const result = await query(
      `SELECT 
        p.*,
        u.full_name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        u.avatar_url as owner_avatar,
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
       FROM properties p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN property_images pi ON p.id = pi.property_id
       ${whereClause}
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...queryParams, limit, offset],
    );
    console.log(whereClause, queryParams);

    // returns a response
    res.status(201).json({
      properties: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalProperties,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single property by ID
const getPropertyById = async (req, res, next) => {
  try {
    // check express validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    // gets the property id from req params
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        p.*,
        u.full_name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        u.avatar_url as owner_avatar,
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
       FROM properties p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN property_images pi ON p.id = pi.property_id
       WHERE p.id = $1
       GROUP BY p.id, u.id`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json({ property: result.rows[0] });
  } catch (error) {
    console.error('Get Property by ID Error:', error);
    next(error);
    // res.status(500).json({ error: error.message });
  }
};

// gets all the properties for a particular user
const getUserProperties = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        p.*,
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
       FROM properties p
       LEFT JOIN property_images pi ON p.id = pi.property_id
       WHERE p.owner_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.userId],
    );
    res.status(200).json({ properties: result.rows });
  } catch (error) {
    next(error);
  }
};

// Create a new property with images upload
const createProperty = async (req, res, next) => {
  const client = await pool.connect();
  try {
    // check express validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    // extract inputs from req body
    const {
      title,
      description,
      property_type, // sale or rent
      listing_type, //options: house, apartment, condo, land, commercial
      price,
      rental_period, // if type is rent, specify rental period (e.g., daily, weekly monthly, yearly)
      bedrooms,
      bathrooms,
      area_sqft,
      address,
      city,
      state,
      zip_code,
      country,
      latitude,
      longitude,
    } = req.body;

    // Validate rent_period if type is rent
    if (listing_type === 'rent' && !rental_period) {
      return res
        .status(400)
        .json({ message: 'rental period is required for rent listings' });
    }

    // start the transanction
    await client.query('BEGIN');

    // run insert query for property
    const result = await client.query(
      `INSERT INTO properties (
      owner_id, title, description, property_type, 
      listing_type, price, rental_period, bedrooms, 
      bathrooms, area_sqft, address, city, state, 
      zip_code, country, latitude, longitude
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *`,
      [
        req.user.userId,
        title,
        description,
        property_type,
        listing_type,
        price,
        rental_period || null,
        bedrooms,
        bathrooms,
        area_sqft || null,
        address,
        city,
        state,
        zip_code || null,
        country,
        latitude || null,
        longitude || null,
      ],
    );
    // gets newly inserted property
    const property = result.rows[0];

    // Upload images to Cloudinary (upto 10 images)
    if (req.files && req.files.length > 0) {
      if (req.files.length > 10) {
        await client.query('ROLLBACK');
        return res
          .status(400)
          .json({ message: 'Maximum 10 images allowed per property' });
      }

      const uploadResults = await upLoadMultipleImgages(
        req.files,
        `properties/${property.id}`,
      );

      // Insert images
      for (let i = 0; i < uploadResults.length; i++) {
        await client.query(
          `INSERT INTO property_images (property_id, image_url, cloudinary_public_id, image_order)
          VALUES ($1, $2, $3, $4)`,
          [
            property.id,
            uploadResults[i].secure_url,
            uploadResults[i].public_id,
            i + 1,
          ],
        );
      }
    }

    // Get images for property
    const imageResult = await client.query(
      `SELECT id, image_url, image_order 
      FROM property_images 
      WHERE property_id = $1 
      ORDER BY image_order`,
      [property.id],
    );

    property.images = imageResult.rows;

    // commit queries
    await client.query('COMMIT');
    // send a response
    res.status(201).json({
      message: 'Property created successfully',
      property,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create Property Error:', error);
    // res.status(500).json({ error: error.message });
    next(error);
  } finally {
    client.release();
  }
};

const updateProperty = async (req, res, next) => {
  try {
    // check express validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    // gets the property if from req params
    const propertyId = req.params.id;
    // checks if property exists and belong to user
    const checkResult = await query(`SELECT * FROM properties WHERE id = $1`, [
      propertyId,
    ]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }
    // console.log(req.user);
    if (checkResult.rows[0].owner_id !== req.user.userId) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to update this property' });
    }

    // Build update query dynamically
    const allowedFields = [
      'title',
      'description',
      'property_type',
      'listing_type',
      'price',
      'rental_period',
      'bedrooms',
      'bathrooms',
      'area_sqft',
      'address',
      'city',
      'state',
      'zip_code',
      'country',
      'latitude',
      'longitude',
      'status',
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(propertyId);

    // update property in database
    const result = await query(
      `UPDATE properties 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *`,
      values,
    );

    // console.log(result.rows);

    // Get property with images
    const imageResult = await query(
      `SELECT id, image_url, image_order FROM property_images
      WHERE property_id = $1 ORDER BY image_order`,
      [propertyId],
    );

    // construct property with images
    const property = result.rows[0];
    property.images = imageResult.rows;

    res.json({ message: `Property updated successfully`, property });
  } catch (error) {
    next(error);
  }
};

// Delete a property by ID
const deleteProperty = async (req, res, next) => {
  const client = await pool.connect();

  try {
    // check express validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    // get property param
    const { id } = req.params;

    // Check if property exists and belongs to the user
    const checkResult = await client.query(
      'SELECT * FROM properties WHERE id = $1',
      [id],
    );
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Property not found' });
    }

    if (checkResult.rows[0].owner_id !== req.user.userId) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'Unauthorized to delete this property' });
    }
    // Get all images to delete from Cloudinary
    const images = await client.query(
      'SELECT cloudinary_public_id FROM property_images WHERE property_id = $1',
      [id],
    );
    // Delete images from Cloudinary
    const deletePromises = images.rows.map((img) =>
      deleteFromCloudinary(img.cloudinary_public_id),
    );
    await Promise.all(deletePromises);

    // Delete property (cascade will delete images from DB)
    await client.query('DELETE FROM properties WHERE id = $1', [id]);
    // commit queries
    await client.query('COMMIT');
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  createProperty,
  updateProperty,
  getProperties,
  getPropertyById,
  getUserProperties,
  deleteProperty,
};
