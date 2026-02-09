-- Comprehensive Real Estate Application Database Schema

-- Create database
CREATE DATABASE real_estate_db;

-- Connect to database
\c real_estate_db;


-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(75) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'rent')),
  property_type VARCHAR(50) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  rent_period VARCHAR(20) CHECK (rent_period IN ('day', 'week', 'month', 'year') OR rent_period IS NULL),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20),
  country VARCHAR(100) NOT NULL,
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  area DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  cloudinary_id VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations view (for easier querying)
CREATE OR REPLACE VIEW conversations AS
SELECT DISTINCT
    CASE 
        WHEN sender_id < recipient_id THEN sender_id 
        ELSE recipient_id 
    END AS user1_id,
    CASE 
        WHEN sender_id < recipient_id THEN recipient_id 
        ELSE sender_id 
    END AS user2_id,
    property_id,
    MAX(created_at) AS last_message_at
FROM messages
GROUP BY user1_id, user2_id, property_id;

-- Indexes for better performance
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_rent_period ON properties(rent_period);
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_property_id ON messages(property_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Add constraint to ensure rent_period is set when type is 'rent'
ALTER TABLE properties ADD CONSTRAINT check_rent_period 
    CHECK ((type = 'rent' AND rent_period IS NOT NULL) OR (type = 'sale' AND rent_period IS NULL));
