const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Upload a single file to cloudinary
const uploadToCloudinary = (fileBuffer, folder = 'real-estate') => {
  console.log('before upload');
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
  console.log('after upload');
};

module.exports = { uploadToCloudinary };
