const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Upload a single file to cloudinary
const uploadToCloudinary = (fileBuffer, folder = 'real-estate') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Uploads multiple images
const upLoadMultipleImgages = async (files, folder = 'real-estate') => {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, folder),
  );
  return await Promise.all(uploadPromises);
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = { uploadToCloudinary, upLoadMultipleImgages };
