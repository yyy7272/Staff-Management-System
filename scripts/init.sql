-- Database initialization script
-- Used for database initialization when Docker container starts

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS StaffDB;
USE StaffDB;

-- Set character set
ALTER DATABASE StaffDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user permissions (if additional users are needed)
-- CREATE USER IF NOT EXISTS 'staffuser'@'%' IDENTIFIED BY 'StaffUser123!@#';
-- GRANT ALL PRIVILEGES ON StaffDB.* TO 'staffuser'@'%';
-- FLUSH PRIVILEGES;

-- Note: Actual table structure will be created by Entity Framework migrations
-- This script only ensures the database exists and is configured correctly