-- Connect to MySQL and run these commands to create your database structure

-- Create the database
-- CREATE DATABASE supplychain;

-- Use the database
USE supplychain;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_key VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0,
    role_status VARCHAR(20) DEFAULT 'pending',
    name VARCHAR(100) NOT NULL,
    number VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loan table
CREATE TABLE loan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(255) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    exp_price DECIMAL(10,2) NOT NULL,
    yield_date VARCHAR(50),
    holding DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    days_left VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create farmer_brodcast table
CREATE TABLE farmer_brodcast (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_key VARCHAR(255) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create offers table
CREATE TABLE offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer VARCHAR(255) NOT NULL,
    seller VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    crop_id INT NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    bid_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    crop_id INT NOT NULL,
    buyer VARCHAR(255) NOT NULL,
    seller VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'no',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create insurance table
CREATE TABLE insurance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'insured',
    name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create report table
CREATE TABLE report (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    sample_size INT NOT NULL,
    defective INT NOT NULL,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create credit_score table
CREATE TABLE credit_score (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(255) NOT NULL,
    total_rating_count INT DEFAULT 0,
    credit_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create processor table
CREATE TABLE processor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    crop_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    processor VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create retailer table
CREATE TABLE retailer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    seller VARCHAR(255) NOT NULL,
    buyer VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer table
CREATE TABLE customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    crop_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    retailer VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    buyer VARCHAR(255) NOT NULL,
    seller VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data for testing
INSERT INTO users (public_key, role, name, number, address, role_status) VALUES
('0x123456789', 'farmer', 'John Farmer', '1234567890', '123 Farm St', 'approved'),
('0x987654321', 'processor', 'Jane Processor', '0987654321', '456 Factory Ave', 'approved'),
('0x555666777', 'retailer', 'Bob Retailer', '5556667777', '789 Store Blvd', 'approved'),
('0x111222333', 'qualitychecker', 'Alice Checker', '1112223333', '321 Quality Ln', 'approved');

-- Verify tables were created
SHOW TABLES;