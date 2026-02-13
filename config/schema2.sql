-- =====================================
-- REAL ESTATE APP -- DATABASE SCHEMA
-- =====================================

-- Drop tables if they exist (for clean setup)
-- Create database
CREATE DATABASE real_estate_db;

-- Connect to database
\c real_estate_db;

-- ==============================
-- USERS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Nullable for OAuth users
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE, -- For Google OAuth
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- PROPERTIES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('sale', 'rent')),
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('house', 'apartment', 'condo', 'townhouse', 'land', 'commercial')),
    price DECIMAL(12, 2) NOT NULL,
    rental_period VARCHAR(20) CHECK (rental_period IN ('monthly', 'weekly', 'daily', 'yearly') OR rental_period IS NULL),
    
    -- Location details
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Property details
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    square_feet INTEGER,
    lot_size INTEGER,
    year_built INTEGER,
    
    -- Amenities (stored as JSON for flexibility)
    amenities JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented', 'inactive')),
    
    -- Metadata
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secure_url TEXT NOT NULL,
    display_order INTEGER NOT NULL, -- 1 to 10 for ordering
    width INTEGER,
    height INTEGER,
    format VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure each property has max 10 images
    CONSTRAINT unique_property_order UNIQUE (property_id, display_order),
    CONSTRAINT valid_display_order CHECK (display_order >= 1 AND display_order <= 10)
);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a user can only favorite a property once
    CONSTRAINT unique_user_property_favorite UNIQUE (user_id, property_id)
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    parent_message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE, -- For threading
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure users can't message themselves
    CONSTRAINT different_sender_recipient CHECK (sender_id != recipient_id)
);

-- ================================
-- PASSWORD RESET TOKENS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Password Reset Tokens
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Properties
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);

-- Property Images
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_display_order ON property_images(property_id, display_order);

-- Favorites
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);

-- Messages
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_property_id ON messages(property_id);
CREATE INDEX idx_messages_parent_id ON messages(parent_message_id);
CREATE INDEX idx_messages_is_read ON messages(recipient_id, is_read);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to properties table
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample users
INSERT INTO users (email, password, full_name, phone, avatar_url) VALUES
('john.doe@example.com', '$2b$10$examplehash1', 'John Doe', '+1234567890', 'https://res.cloudinary.com/demo/image/upload/sample_avatar.jpg'),
('jane.smith@example.com', '$2b$10$examplehash2', 'Jane Smith', '+1234567891', NULL);

-- Insert sample properties
INSERT INTO properties (
    owner_id, title, description, listing_type, property_type, 
    price, rental_period, address, city, state, country, zip_code,
    bedrooms, bathrooms, square_feet, status
) VALUES
(1, 'Beautiful Modern House', 'A stunning 3-bedroom house with modern amenities', 'sale', 'house', 
 450000.00, NULL, '123 Main Street', 'Los Angeles', 'California', 'USA', '90001',
 3, 2.5, 2000, 'active'),
(1, 'Downtown Luxury Apartment', 'Spacious apartment in the heart of downtown', 'rent', 'apartment', 
 2500.00, 'monthly', '456 City Avenue', 'New York', 'New York', 'USA', '10001',
 2, 2.0, 1200, 'active');