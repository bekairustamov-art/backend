-- Migration: Add indexes to users table for better search performance
-- Run this SQL script on your MySQL database

USE your_database_name; -- Replace with your actual database name

-- Add index on name column for faster search
CREATE INDEX idx_users_name ON users(name);

-- Add index on phone column for faster search
CREATE INDEX idx_users_phone ON users(phone);

-- Add composite index on name and phone for combined search
CREATE INDEX idx_users_name_phone ON users(name, phone);

-- Add index on is_wholesaler for filtering
CREATE INDEX idx_users_wholesaler ON users(is_wholesaler);

-- Optional: Add composite index for wholesaler filtering with search
CREATE INDEX idx_users_wholesaler_name_phone ON users(is_wholesaler, name, phone);

-- Verify indexes were created
SHOW INDEX FROM users;
