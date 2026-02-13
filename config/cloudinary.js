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

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of file objects with buffer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} - Array of upload results
 */
const uploadMultipleImages = async (files, folder = 'properties') => {
  const uploadPromises = files.map((file, index) =>
    uploadImage(file.buffer, folder, {
      public_id: `${folder}_${Date.now()}_${index}`,
    }),
  );

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error('Failed to upload multiple images');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public_id of the image to delete
 * @returns {Promise<Object>} - Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public_ids to delete
 * @returns {Promise<Array>} - Deletion results
 */
const deleteMultipleImages = async (publicIds) => {
  const deletePromises = publicIds.map((publicId) => deleteImage(publicId));

  try {
    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw new Error('Failed to delete multiple images');
  }
};

module.exports = cloudinary;
