// ============================================
// CLOUDINARY SERVICE
// Image Upload & Management
// ============================================

const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const streamifier = require('streamifier');

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder name
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Upload result containing public_id and secure_url
 */
const uploadImage = (buffer, folder = 'properties', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }, // Limit image dimensions
          { quality: 'auto:good' }, // Optimize image quality
          { fetch_format: 'auto' }, // Convert to optimal format (e.g., WebP)
        ],
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = cloudinary;
