const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res
      .status(400)
      .json({ message: 'File size too large. Maximum size is 7MB' });
  }

  // Multer file type error
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Too many files uploaded' });
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    return res
      .status(400)
      .json({ message: 'Duplicate entry. This record already exists' });
  }

  if (err.code === '23503') {
    return res
      .status(400)
      .json({ message: 'Referenced record does not exist' });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
