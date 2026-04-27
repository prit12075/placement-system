# Database Migrations

This directory contains SQL migration scripts for evolving the PlaceMe database schema over time.

## How to Apply Migrations

### For New Installations
When setting up a fresh database, apply migrations in order:

```bash
# 1. Create database with initial schema
mysql -u root -p placeme < schema.sql

# 2. Apply migrations in sequence
mysql -u root -p placeme < server/migrations/001_normalize_user_names.sql

# 3. Seed sample data
node server/seed.js
```

### For Existing Installations
To upgrade an existing database:

```bash
# 1. Backup your database FIRST
mysqldump -u root -p placeme > placeme_backup.sql

# 2. Apply migrations in order
mysql -u root -p placeme < server/migrations/001_normalize_user_names.sql

# 3. Verify migration (check the "Verification queries" section in the migration file)
mysql -u root -p placeme < verify_migration.sql
```

## Migration: 001_normalize_user_names.sql

### What Changed
- Separates the `name` column into `first_name` and `last_name`
- Improves database normalization (BCNF compliance)
- Enables better querying, sorting, and reporting

### Migration Steps
1. Creates new `first_name` and `last_name` columns (nullable initially)
2. Populates new columns by parsing existing `name` data
3. Adds NOT NULL constraints after successful population
4. Creates index on (last_name, first_name) for performance
5. Optionally drops the old `name` column (manual step for safety)

### Safety
- ✅ Backward compatible - old `name` column remains until explicitly dropped
- ✅ Non-breaking - can be rolled back by manually recreating `name` column
- ✅ Includes verification queries to check migration success

### How to Handle Edge Cases
If you have names that don't fit the "FirstName LastName" pattern:

```sql
-- Single word names (e.g., "Madonna")
UPDATE users SET last_name = '' WHERE first_name LIKE '%' AND name NOT LIKE '% %';

-- Multi-part names (e.g., "María José García López")
-- Manually update as needed
UPDATE users SET first_name = 'María José', last_name = 'García López'
WHERE email = 'user@example.com';

-- Verify no missing data
SELECT * FROM users WHERE first_name = '' OR first_name IS NULL;
```

## Migration History

| File | Date | Description |
|------|------|-------------|
| 001_normalize_user_names.sql | 2026-04-27 | Atomize user name field |

## Best Practices

1. **Always backup first**: `mysqldump -u root -p placeme > backup_$(date +%Y%m%d_%H%M%S).sql`
2. **Test in development**: Apply migrations to a copy of production data first
3. **Review verification queries**: Check that data looks correct after migration
4. **Document changes**: If you need custom migrations, follow this pattern
5. **Keep migrations sequential**: Don't skip or reorder migration files

## Writing New Migrations

When creating new migrations, follow this structure:

```sql
-- Migration: NNN_description.sql
-- Description: What this migration does
-- Date: YYYY-MM-DD
-- Author: Your Name

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Description of first step
-- ═══════════════════════════════════════════════════════════════════════════
-- SQL here

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Description of second step
-- ═══════════════════════════════════════════════════════════════════════════
-- SQL here

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification queries
-- ═══════════════════════════════════════════════════════════════════════════
/*
SELECT ... verify the migration worked
*/
```

## Rollback Procedures

### Rolling Back Migration 001
If you need to revert the normalization:

```sql
-- Reconstruct the name column
ALTER TABLE users ADD COLUMN name VARCHAR(100);
UPDATE users SET name = CONCAT_WS(' ', first_name, last_name);
ALTER TABLE users MODIFY COLUMN name VARCHAR(100) NOT NULL;

-- Drop the new columns and index
DROP INDEX idx_users_name ON users;
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

## Support

For issues or questions about migrations:
1. Check the verification queries in the migration file
2. Review the NORMALIZATION_CHANGES.md documentation
3. Contact the development team with the migration name and error details
