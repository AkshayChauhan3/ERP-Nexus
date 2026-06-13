-- ERP-Nexus Database Seed Data
-- Component 4: Modules & Admin Initialization

BEGIN;

-- 1. Insert the 4 ERP modules
INSERT INTO modules (module_name, description) VALUES
('sales', 'Sales Module for managing orders, clients, and sales pipelines'),
('purchase', 'Purchase Module for managing vendors, POs, and purchasing workflows'),
('product', 'Product Module for inventory, items catalog, and variants'),
('manufacture', 'Manufacture Module for Bill of Materials, production planning, and work orders')
ON CONFLICT (module_name) DO NOTHING;

-- 2. Insert the single Administrator account
-- login_id: admin
-- password: admin (hashed using bcrypt)
-- status: APPROVED
-- is_admin: TRUE
INSERT INTO users (login_id, email, password_hash, is_admin, status) VALUES
('admin', 'admin@erp-nexus.local', '$2b$12$Iv9O1AIHgZRKZ1wFkCrvF.FBq9/ixBL1/vWOLCOwUFsFmeA/zTXRC', TRUE, 'APPROVED')
ON CONFLICT (login_id) DO NOTHING;

-- 3. Insert user profile for the Administrator
INSERT INTO user_profiles (user_id, full_name, position, email_display, address, mobile_no, profile_photo)
SELECT 
    user_id, 
    'System Administrator', 
    'Administrator', 
    'admin@erp-nexus.local', 
    'ERP-Nexus Headquarters', 
    '+910000000000', 
    NULL
FROM users 
WHERE login_id = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- 4. Grant administrator access to all modules
INSERT INTO user_module_access (user_id, module_id, granted_by)
SELECT 
    u.user_id, 
    m.module_id, 
    u.user_id -- Admin grants it to themselves
FROM users u
CROSS JOIN modules m
WHERE u.login_id = 'admin'
ON CONFLICT (user_id, module_id) DO NOTHING;

COMMIT;
