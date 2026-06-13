-- ERP-Nexus Performance Indexes
-- Component 3: Optimization and Performance

-- 1. Index on users status for quick filtering of pending registration requests
CREATE INDEX idx_users_status ON users(status);

-- 2. Index on user_profiles full_name for directory lookup and searches
CREATE INDEX idx_user_profiles_name ON user_profiles(full_name);

-- 3. Index on user_module_access for module-specific queries
CREATE INDEX idx_user_module_access_module ON user_module_access(module_id);

-- 4. Indexes on audit_log for audit history tracking
CREATE INDEX idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX idx_audit_log_target ON audit_log(target_user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
