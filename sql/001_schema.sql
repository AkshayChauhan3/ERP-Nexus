-- ERP-Nexus Database Schema
-- Component 1: Tables and Constraints

-- Enable UUID generation extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Core Auth & Roles)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enforce exactly one admin account at the database level
CREATE UNIQUE INDEX unique_single_admin ON users (is_admin) WHERE (is_admin = TRUE);

-- 2. User Profiles Table (Metadata and Details)
CREATE TABLE user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    position VARCHAR(100) NOT NULL,
    email_display VARCHAR(255) NOT NULL, -- Email matching user email, but stored in profile for display
    address TEXT,
    mobile_no VARCHAR(15),
    profile_photo TEXT, -- Stores file path (e.g. 'profile_pic/filename.jpg') or URL
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Modules Registry
CREATE TABLE modules (
    module_id SERIAL PRIMARY KEY,
    module_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. User Module Access (Pivot Table)
CREATE TABLE user_module_access (
    access_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    module_id INT NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    granted_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE(user_id, module_id)
);

-- 5. Audit Log Table (Admin Actions Tracking)
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- e.g., 'REGISTRATION_APPROVED', 'PROFILE_UPDATED', 'MODULE_GRANTED'
    changed_fields JSONB, -- Record the snapshot of changes: { "address": { "old": "X", "new": "Y" } }
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
