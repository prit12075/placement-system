-- Migration: 001_normalize_user_names.sql
-- Description: Normalize the user table by separating name into first_name and last_name
-- Date: 2026-04-27
-- Author: PlaceMe Development Team

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Create new atomic name columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE users ADD COLUMN first_name VARCHAR(50);
ALTER TABLE users ADD COLUMN last_name VARCHAR(50);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Populate new columns from existing name data
-- ═══════════════════════════════════════════════════════════════════════════
-- This handles most common name patterns (e.g., "Arjun Sharma")
UPDATE users SET
  first_name = TRIM(SUBSTRING_INDEX(name, ' ', 1)),
  last_name = TRIM(SUBSTRING_INDEX(name, ' ', -1))
WHERE name IS NOT NULL;

-- Handle edge case where name is a single word
UPDATE users SET
  last_name = ''
WHERE last_name = first_name AND name NOT LIKE '% %';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Verify data migration
-- ═══════════════════════════════════════════════════════════════════════════
-- Check for any NULL values that need manual intervention
-- SELECT id, email, name, first_name, last_name FROM users WHERE first_name IS NULL OR last_name IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Add constraints after successful migration
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE users MODIFY COLUMN first_name VARCHAR(50) NOT NULL;
ALTER TABLE users MODIFY COLUMN last_name VARCHAR(50) NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Add index for efficient sorting and filtering
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_users_name ON users(last_name, first_name);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 6: Drop old column (UNCOMMENT ONLY AFTER VERIFICATION)
-- ═══════════════════════════════════════════════════════════════════════════
-- ALTER TABLE users DROP COLUMN name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification queries to run after migration:
-- ═══════════════════════════════════════════════════════════════════════════
/*
-- Check all records have both fields
SELECT COUNT(*) as total_records,
       COUNT(CASE WHEN first_name IS NULL OR first_name = '' THEN 1 END) as missing_first,
       COUNT(CASE WHEN last_name IS NULL OR last_name = '' THEN 1 END) as missing_last
FROM users;

-- Sample records to verify format
SELECT id, email, first_name, last_name, CONCAT(first_name, ' ', last_name) as full_name
FROM users LIMIT 10;

-- Test sorting by last name
SELECT id, email, CONCAT(last_name, ', ', first_name) as formal_name
FROM users
ORDER BY last_name, first_name
LIMIT 10;
*/
