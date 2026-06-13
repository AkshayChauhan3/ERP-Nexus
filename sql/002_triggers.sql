-- ERP-Nexus Database Triggers & Functions
-- Component 2: Automated Policies, Sync, and Timestamps

-- 1. Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp update to users and user_profiles
CREATE TRIGGER trigger_update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_profiles_timestamp
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();


-- 2. Trigger Function to enforce Mutability rules on users table
CREATE OR REPLACE FUNCTION check_user_mutability()
RETURNS TRIGGER AS $$
DECLARE
    is_admin_session BOOLEAN;
BEGIN
    -- Fetch the is_admin state from the session setting 'erp.is_admin'
    -- If it's not set or is empty, we default to FALSE
    BEGIN
        is_admin_session := COALESCE(NULLIF(current_setting('erp.is_admin', true), ''), 'false')::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        is_admin_session := FALSE;
    END;

    -- login_id is strictly immutable for everyone (including admins)
    IF NEW.login_id IS DISTINCT FROM OLD.login_id THEN
        RAISE EXCEPTION 'login_id is immutable and cannot be updated.';
    END IF;

    -- Non-admin role restrictions
    IF NOT is_admin_session THEN
        IF NEW.email IS DISTINCT FROM OLD.email THEN
            RAISE EXCEPTION 'email can only be modified by an administrator.';
        END IF;
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
            RAISE EXCEPTION 'is_admin flag can only be modified by an administrator.';
        END IF;
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'user registration status/approval can only be modified by an administrator.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_user_mutability
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_user_mutability();


-- 3. Trigger Function to enforce Mutability rules on user_profiles table
CREATE OR REPLACE FUNCTION check_profile_mutability()
RETURNS TRIGGER AS $$
DECLARE
    is_admin_session BOOLEAN;
BEGIN
    -- Fetch the is_admin state from the session setting 'erp.is_admin'
    BEGIN
        is_admin_session := COALESCE(NULLIF(current_setting('erp.is_admin', true), ''), 'false')::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        is_admin_session := FALSE;
    END;

    -- Non-admin role restrictions for profile info
    IF NOT is_admin_session THEN
        IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
            RAISE EXCEPTION 'full_name can only be modified by an administrator.';
        END IF;
        IF NEW.position IS DISTINCT FROM OLD.position THEN
            RAISE EXCEPTION 'position can only be modified by an administrator.';
        END IF;
        IF NEW.email_display IS DISTINCT FROM OLD.email_display THEN
            RAISE EXCEPTION 'email_display can only be modified by an administrator.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_profile_mutability
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_profile_mutability();


-- 4. Sync Function to propagate users.email updates to user_profiles.email_display
CREATE OR REPLACE FUNCTION sync_user_email_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles
    SET email_display = NEW.email
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_email_to_profile
    AFTER UPDATE OF email ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_email_to_profile();
