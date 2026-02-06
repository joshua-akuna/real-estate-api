-- Comprehensive Real Estate Application Database Schema

-- Create database
CREATE DATABASE real_estate_db;

-- Connect to database
\c real_estate_db;


-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(10) NOT NULL CHECK (type IN ('sale', 'rent')),
  price DECIMAL(12, 2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area INTEGER, -- in square feet
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(10),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);