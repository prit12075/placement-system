# DBMS Concepts Used in PlaceMe - College Placement Management System

## Project Overview
PlaceMe is a comprehensive college placement management system demonstrating advanced DBMS concepts through a full-stack implementation with MySQL backend, Node.js/Express API, and React frontend.

---

## 1. NORMALIZATION

### Boyce-Codd Normal Form (BCNF)
The database schema achieves BCNF by ensuring every determinant is a candidate key.

#### Example: User Name Atomization (BCNF Implementation)
```sql
-- BEFORE (Non-atomic):
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100) -- Violates atomic principle
);

-- AFTER (Atomic):
CREATE TABLE users (
  id INT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL, -- Atomic
  last_name VARCHAR(50) NOT NULL,  -- Atomic
  INDEX idx_users_name (last_name, first_name)
);
```

**Concept Applied**: Atomicity - Each field contains only one indivisible value.

### Third Normal Form (3NF)
- All attributes depend on the primary key only
- No transitive dependencies between non-key attributes
- Example: `students.department` depends only on `students.id`, not on any other attribute

### Second Normal Form (2NF)
- All non-key attributes depend on the entire primary key
- No partial dependencies on composite keys

### First Normal Form (1NF)
- All attribute values are atomic (single-valued)
- No repeating groups or multi-valued attributes
- Example: `skills` stored as comma-separated text, not as a separate repeating group table

---

## 2. ENTITY-RELATIONSHIP (E-R) MODEL

### Entities and Their Attributes

#### 1. **USERS Entity**
```sql
Entity: USERS
Attributes:
  - id (PK)
  - email (UNIQUE)
  - password
  - role (ENUM: 'admin', 'student')
  - first_name
  - last_name
  - phone
  - is_active (Boolean)
  - last_login (Temporal)
  - created_at (Temporal)
  - updated_at (Temporal)
```

#### 2. **STUDENTS Entity**
```sql
Entity: STUDENTS
Attributes:
  - id (PK)
  - user_id (FK to USERS)
  - enrollment_no (UNIQUE)
  - department
  - batch_year
  - cgpa (Numeric)
  - tenth_pct (Numeric)
  - twelfth_pct (Numeric)
  - backlogs (Integer)
  - skills (Text)
  - resume_url
  - placement_status (ENUM)
  - created_at, updated_at
```

#### 3. **COMPANIES Entity**
```sql
Entity: COMPANIES
Attributes:
  - id (PK)
  - name
  - email
  - website
  - industry
  - description (Text)
  - location
  - created_at, updated_at
```

#### 4. **JOB_POSTINGS Entity**
```sql
Entity: JOB_POSTINGS
Attributes:
  - id (PK)
  - company_id (FK)
  - title
  - description
  - role
  - job_type (ENUM)
  - package_min, package_max (Numeric)
  - location
  - drive_date (Date)
  - deadline (Date)
  - min_cgpa, min_tenth, min_twelfth (Numeric)
  - max_backlogs (Integer)
  - eligible_departments (String)
  - positions (Integer)
  - skills_required (Text)
  - status (ENUM)
  - created_by (FK to USERS)
```

#### 5. **APPLICATIONS Entity**
```sql
Entity: APPLICATIONS
Attributes:
  - id (PK)
  - student_id (FK)
  - job_id (FK)
  - status (ENUM)
  - applied_at (Temporal)
  - updated_at (Temporal)
```

#### 6. **PLACEMENTS Entity**
```sql
Entity: PLACEMENTS
Attributes:
  - id (PK)
  - student_id (FK, UNIQUE)
  - job_id (FK)
  - application_id (FK)
  - package (Numeric)
  - offer_date (Date)
  - joining_date (Date)
  - status (ENUM)
```

#### 7. **NOTIFICATIONS Entity**
```sql
Entity: NOTIFICATIONS
Attributes:
  - id (PK)
  - user_id (FK)
  - title
  - message (Text)
  - type (ENUM)
  - link
  - is_read (Boolean)
  - created_at (Temporal)
```

### Relationships

#### One-to-Many Relationships
```
USERS (1) -----> (Many) STUDENTS
  ↓ user_id (FK in STUDENTS)
  └─ Relationship: One admin can manage many students
  
COMPANIES (1) -----> (Many) JOB_POSTINGS
  ↓ company_id (FK in JOB_POSTINGS)
  └─ Relationship: One company posts many jobs
  
JOB_POSTINGS (1) -----> (Many) APPLICATIONS
  ↓ job_id (FK in APPLICATIONS)
  └─ Relationship: One job receives many applications
  
STUDENTS (1) -----> (Many) APPLICATIONS
  ↓ student_id (FK in APPLICATIONS)
  └─ Relationship: One student applies to many jobs
  
USERS (1) -----> (Many) NOTIFICATIONS
  ↓ user_id (FK in NOTIFICATIONS)
  └─ Relationship: One user receives many notifications
```

#### One-to-One Relationships
```
STUDENTS (1) -----> (1) PLACEMENTS
  ↓ student_id (UNIQUE FK in PLACEMENTS)
  └─ Relationship: One student gets placed once (uniqueness constraint)
  
STUDENTS (1) -----> (1) USERS
  ↓ user_id (UNIQUE FK in STUDENTS)
  └─ Relationship: One student account per user
```

---

## 3. RELATIONAL DATABASE MODEL

### Schema Structure
```
┌─────────────────────────────────────────────────────────┐
│              PLACEMENT MANAGEMENT SYSTEM                 │
├─────────────────────────────────────────────────────────┤
│
│  USERS (Authentication & Base User Info)
│    ├── STUDENTS (Extension of USERS)
│    │    ├── APPLICATIONS (Many-to-Many bridge)
│    │    └── PLACEMENTS (One-to-One)
│    │
│    └── NOTIFICATIONS (One-to-Many)
│
│  COMPANIES (Organization Management)
│    └── JOB_POSTINGS
│         ├── APPLICATIONS
│         └── PLACEMENTS
│
└─────────────────────────────────────────────────────────┘
```

### Design Principles Applied
1. **Separation of Concerns**: Users and Students are separate tables
2. **Extensibility**: Role-based ENUM allows future admin/recruiter roles
3. **Flexibility**: Skills and eligible departments stored as TEXT for flexibility
4. **Integrity**: Foreign keys maintain referential integrity

---

## 4. REFERENTIAL INTEGRITY & CONSTRAINTS

### Primary Key Constraints
```sql
-- Every table has a PRIMARY KEY
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier
  ...
);
```

### Foreign Key Constraints with Cascade
```sql
-- Students inherits from Users
CREATE TABLE students (
  user_id INT NOT NULL UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications reference both Students and Jobs
CREATE TABLE applications (
  student_id INT NOT NULL,
  job_id INT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_job (student_id, job_id)  -- Prevent duplicate applications
);

-- Placements have cascading deletes
CREATE TABLE placements (
  student_id INT NOT NULL UNIQUE,
  job_id INT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE
);
```

### Unique Constraints
```sql
-- Ensure no duplicate records
CREATE TABLE users (
  email VARCHAR(255) NOT NULL UNIQUE  -- Each email is unique
);

CREATE TABLE students (
  user_id INT NOT NULL UNIQUE,        -- One user per student account
  enrollment_no VARCHAR(30) NOT NULL UNIQUE  -- Enrollment number is unique
);

CREATE TABLE placements (
  student_id INT NOT NULL UNIQUE     -- Each student placed only once
);

CREATE TABLE applications (
  UNIQUE KEY uq_student_job (student_id, job_id)  -- Prevent duplicate applications
);
```

### Check Constraints & Enums
```sql
-- Status validation using ENUM
CREATE TABLE users (
  role ENUM('admin', 'student') NOT NULL DEFAULT 'student'
);

CREATE TABLE applications (
  status ENUM('applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn')
);

CREATE TABLE job_postings (
  job_type ENUM('full-time', 'internship'),
  status ENUM('upcoming', 'ongoing', 'completed', 'cancelled')
);
```

### Default Values & Temporal Data
```sql
CREATE TABLE users (
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 5. INDEXING FOR QUERY OPTIMIZATION

### Index Strategy
```sql
-- Single Column Indexes
INDEX idx_users_role (role)              -- Filter by user role
INDEX idx_users_active (is_active)       -- Filter active users
INDEX idx_students_dept (department)     -- Filter by department
INDEX idx_students_batch (batch_year)    -- Filter by batch
INDEX idx_students_status (placement_status)  -- Filter placement status
INDEX idx_jobs_status (status)           -- Filter job status
INDEX idx_jobs_company (company_id)      -- Find jobs by company
INDEX idx_jobs_deadline (deadline)       -- Filter by deadline
INDEX idx_app_status (status)            -- Filter applications by status
INDEX idx_notif_user (user_id)          -- Get notifications for user
INDEX idx_notif_read (is_read)          -- Filter unread notifications

-- Composite Indexes
INDEX idx_users_name (last_name, first_name)    -- Efficient name-based sorting
INDEX idx_placement_job (job_id)               -- Find placements by job

-- Prevents Duplicate Applications
UNIQUE KEY uq_student_job (student_id, job_id)
```

### Why These Indexes?
```
Query: SELECT * FROM students WHERE department = 'CSE'
Index Used: idx_students_dept
Benefit: O(log n) instead of O(n) full table scan

Query: SELECT * FROM users ORDER BY last_name, first_name
Index Used: idx_users_name
Benefit: Index provides pre-sorted results

Query: SELECT * FROM applications WHERE student_id = 5 AND job_id = 10
Index Used: uq_student_job
Benefit: Instant lookup + prevents duplicates
```

---

## 6. VIEWS

### Placement Summary View
```sql
CREATE OR REPLACE VIEW placement_summary AS
  SELECT
    s.department,
    COUNT(DISTINCT s.id) AS total_students,
    COUNT(DISTINCT p.student_id) AS placed_students,
    ROUND(AVG(p.package), 2) AS avg_package,
    MAX(p.package) AS max_package,
    MIN(p.package) AS min_package
  FROM students s
  LEFT JOIN placements p ON s.id = p.student_id AND p.status = 'confirmed'
  GROUP BY s.department;
```

**DBMS Concept**: Views provide a logical abstraction over the underlying tables.

**Benefits**:
- Simplifies complex queries for reporting
- Single source of truth for department statistics
- Encapsulates business logic
- Security: Can restrict access to specific columns

**Usage Example**:
```javascript
// In admin dashboard
const [deptStats] = await pool.query('SELECT * FROM placement_summary ORDER BY total_students DESC');
// Shows: CSE: 5 total, 4 placed, ₹20.5 LPA average
```

---

## 7. TRIGGERS

### Automatic Status Updates
```sql
-- Trigger 1: Update student placement status when placement is confirmed
CREATE TRIGGER after_placement_insert
AFTER INSERT ON placements
FOR EACH ROW
BEGIN
  UPDATE students SET placement_status = 'placed' 
  WHERE id = NEW.student_id;
  
  UPDATE applications SET status = 'selected' 
  WHERE id = NEW.application_id;
END;

-- Trigger 2: Revert placement status when placement is deleted
CREATE TRIGGER after_placement_delete
AFTER DELETE ON placements
FOR EACH ROW
BEGIN
  UPDATE students SET placement_status = 'unplaced' 
  WHERE id = OLD.student_id;
END;
```

**DBMS Concept**: Triggers maintain data consistency automatically.

**Business Logic Enforced**:
1. When a placement is created → automatically mark student as "placed"
2. When a placement is deleted → automatically revert student to "unplaced"
3. Prevents manual inconsistencies in application status

---

## 8. TRANSACTIONS & ACID PROPERTIES

### Transaction Implementation
```javascript
// In server/routes/auth.js (student registration)
router.post('/register', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { first_name, last_name, email, password, ... } = req.body;
    
    // BEGIN TRANSACTION
    await conn.beginTransaction();
    
    // Step 1: Insert user
    const [userResult] = await conn.query(
      'INSERT INTO users (email, password, role, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hash, 'student', first_name, last_name, phone]
    );
    
    // Step 2: Insert student profile
    const [sRes] = await conn.query(
      'INSERT INTO students (user_id, enrollment_no, department, batch_year, ...) VALUES (...)',
      [userResult.insertId, enrollment_no, department, batch_year, ...]
    );
    
    // COMMIT on success
    await conn.commit();
    res.json({ token, user: { ... } });
    
  } catch (e) {
    // ROLLBACK on error
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
});
```

### ACID Properties Demonstrated

#### 1. **Atomicity** (All-or-Nothing)
- User AND student profile are created together
- If either fails, both are rolled back
- No partial records in database

#### 2. **Consistency** (Valid State)
- Triggers automatically maintain consistency
- Foreign key constraints prevent orphaned records
- Placement status always matches placement records

#### 3. **Isolation** (No Dirty Reads)
```javascript
// InnoDB provides transaction isolation
// One transaction's changes invisible to others until COMMIT
// Prevents race conditions in concurrent operations
```

#### 4. **Durability** (Persistent)
- Once COMMIT succeeds, data survives crashes
- InnoDB logs all changes to disk
- Recovery is automatic after restart

---

## 9. DATA TYPES & DOMAINS

### Domain Definitions
```sql
-- Numeric Domain
DECIMAL(4,2)   -- CGPA: values like 8.95
DECIMAL(5,2)   -- Percentages: values like 92.50
INT             -- IDs, batch years, counts

-- String Domain
VARCHAR(50)     -- first_name, last_name, department
VARCHAR(100)    -- titles, descriptions
VARCHAR(255)    -- emails, URLs
TEXT            -- skills, descriptions, messages

-- Temporal Domain
TIMESTAMP       -- created_at, updated_at (auto-managed)
DATE            -- drive_date, deadline, offer_date, joining_date

-- Boolean Domain
BOOLEAN         -- is_active, is_read

-- Enumerated Domain
ENUM('admin', 'student')                    -- user role
ENUM('full-time', 'internship')            -- job type
ENUM('unplaced', 'placed')                 -- placement status
ENUM('applied', 'shortlisted', ...)        -- application status
```

### Domain Constraints
- `VARCHAR(50) NOT NULL` → First name must be non-empty, max 50 chars
- `DECIMAL(4,2)` → CGPA ranges from 0.00 to 99.99
- `ENUM(...)` → Only specific values allowed
- `UNIQUE` → No duplicates
- `DEFAULT CURRENT_TIMESTAMP` → Automatic timestamp

---

## 10. QUERY OPTIMIZATION & EXECUTION

### Efficient Query Examples

#### 1. **Filtered Query with Index**
```sql
-- Uses idx_students_status index
SELECT s.*, u.first_name, u.last_name 
FROM students s 
JOIN users u ON s.user_id = u.id
WHERE s.placement_status = 'unplaced'
ORDER BY u.last_name, u.first_name;

-- Execution: Index lookup → O(log n) instead of table scan O(n)
```

#### 2. **Aggregation Query with GROUP BY**
```sql
SELECT 
  s.department,
  COUNT(DISTINCT s.id) AS total_students,
  COUNT(DISTINCT p.student_id) AS placed_students,
  AVG(p.package) AS avg_package
FROM students s
LEFT JOIN placements p ON s.id = p.student_id
GROUP BY s.department;

-- DBMS Concept: Aggregation functions with grouping
-- Used in: placement_summary view, admin dashboard
```

#### 3. **Subquery with JOIN**
```sql
-- Find eligible students for a job (using subqueries)
SELECT s.*, u.first_name, u.last_name, u.email 
FROM students s 
JOIN users u ON s.user_id = u.id
WHERE s.placement_status = 'unplaced' 
  AND s.cgpa >= 8.0 
  AND s.tenth_pct >= 80 
  AND s.twelfth_pct >= 75 
  AND s.backlogs <= 0
  AND (s.department IN ('CSE', 'ECE') OR s.department = 'ALL')
  AND NOT EXISTS (
    SELECT 1 FROM applications a 
    WHERE a.student_id = s.id AND a.job_id = 15
  );

-- DBMS Concept: NOT EXISTS for excluding already-applied students
-- Performance: Efficient with proper indexes
```

#### 4. **Window Functions (Conceptual)**
```sql
-- Although not used in PlaceMe, the architecture supports:
SELECT 
  first_name, last_name,
  package,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY package DESC) AS rank
FROM placements p
JOIN students s ON p.student_id = s.id;

-- Would show: Top-paid student per department
```

---

## 11. CONCURRENCY CONTROL

### MVCC (Multi-Version Concurrency Control)
InnoDB uses MVCC to handle multiple concurrent transactions:

```javascript
// Two students applying simultaneously for same job
// Transaction 1 (Student A)          Transaction 2 (Student B)
// INSERT application (A, Job 1) ----> INSERT application (B, Job 1)
// ↓                                    ↓
// Both see consistent read views
// Both inserts succeed (UNIQUE constraint prevents duplicates)
```

### Lock Management
```sql
-- InnoDB automatically handles:
-- - Row-level locks (default)
-- - Prevents lost updates
-- - Example: Two admins editing same student
--   First edit acquires lock, second waits
--   No overwrite occurs
```

---

## 12. BACKUP & RECOVERY

### Schema Design for Recovery
```sql
-- Temporal tracking enables point-in-time recovery
CREATE TABLE users (
  ...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Can reconstruct state at any point in time
SELECT * FROM placements WHERE created_at <= '2026-04-20 10:00:00';
```

### Automated Backups (Recommended)
```bash
# Daily backup script
mysqldump -u root -p placeme > backups/placeme_$(date +%Y%m%d).sql

# Disaster recovery
mysql -u root -p placeme < backups/placeme_20260427.sql
```

---

## 13. AUTHENTICATION & SECURITY (DBMS Layer)

### Password Hashing (Backend Layer)
```javascript
// Not pure DBMS, but security principle
const hash = await bcrypt.hash(password, 10);
// Stored: hashed value, not plaintext
// DB enforces: password VARCHAR(255) - stores hash only
```

### Role-Based Access Control (RBAC)
```sql
-- Database stores roles
CREATE TABLE users (
  role ENUM('admin', 'student')
);

-- Backend enforces (example):
-- Admin can: CREATE, READ, UPDATE, DELETE any student
-- Student can: READ own profile, UPDATE own profile
```

---

## 14. DATA INTEGRITY & VALIDATION

### Database-Level Validation
```sql
-- Numeric constraints
ALTER TABLE placements 
  ADD CONSTRAINT check_package CHECK (package > 0);

-- Date constraints (implicit via business logic)
-- deadline >= drive_date (enforced in application code)

-- Enum validation
CREATE TABLE applications (
  status ENUM('applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn')
  -- Only these 6 values allowed
);
```

### Application-Level Validation
```javascript
// Ensures package is positive
if (package < 0) {
  throw new Error('Package must be positive');
}

// Ensures eligibility before application
if (student.cgpa < job.min_cgpa) {
  throw new Error('CGPA not meeting minimum requirement');
}
```

---

## 15. SCHEMA DESIGN PATTERNS

### Entity Extension Pattern (USERS → STUDENTS)
```sql
-- Rather than adding all fields to USERS:
CREATE TABLE students (
  id INT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  enrollment_no VARCHAR(30) UNIQUE,
  department VARCHAR(50),
  batch_year INT,
  cgpa DECIMAL(4,2),
  ...
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Benefits:
-- - Cleanly separates base user from student-specific data
-- - Can add future admin, recruiter without clutter
-- - Single point of authentication (users table)
```

### Bridge Table Pattern (APPLICATIONS)
```sql
-- Many-to-many relationship between STUDENTS and JOB_POSTINGS
-- Cannot be represented directly; needs bridge table

CREATE TABLE applications (
  id INT PRIMARY KEY,
  student_id INT NOT NULL,      -- FK to student
  job_id INT NOT NULL,          -- FK to job
  status ENUM(...),             -- Additional data
  applied_at TIMESTAMP,         -- Additional data
  UNIQUE KEY (student_id, job_id),  -- Prevent duplicates
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (job_id) REFERENCES job_postings(id)
);

-- Enables: Find all jobs a student applied to
--          Find all students applying for a job
--          Track application status
```

---

## 16. REPORTING & ANALYTICS (OLAP)

### Analytical Queries
```javascript
// Placement rate calculation
const rate = (totalPlacements / totalStudents) * 100;

// Department-wise statistics
const deptStats = await pool.query('SELECT * FROM placement_summary');

// Recent placements for dashboard
const [recentPlacements] = await pool.query(`
  SELECT p.package, p.offer_date, u.first_name, u.last_name, s.department,
         c.name AS company_name, j.role
  FROM placements p
  JOIN students s ON p.student_id = s.id
  JOIN users u ON s.user_id = u.id
  JOIN job_postings j ON p.job_id = j.id
  JOIN companies c ON j.company_id = c.id
  WHERE p.status = 'confirmed'
  ORDER BY p.created_at DESC LIMIT 6
`);

// Job status distribution
const [jobStatus] = await pool.query(
  'SELECT status, COUNT(*) AS count FROM job_postings GROUP BY status'
);
```

**DBMS Concepts**:
- Aggregation: COUNT(*), AVG, MAX, MIN
- Grouping: GROUP BY
- Filtering: WHERE, HAVING
- Ordering: ORDER BY
- Limiting: LIMIT

---

## 17. NORMALIZATION REFACTORING (RECENT)

### Atomization of Name Field
```sql
-- BEFORE (Non-atomic)
CREATE TABLE users (name VARCHAR(100));

-- AFTER (Atomic - Achieves 1NF, 3NF, BCNF)
CREATE TABLE users (
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  INDEX idx_users_name (last_name, first_name)
);
```

**Normalization Improvements**:
- ✅ 1NF: All attributes are atomic
- ✅ 3NF: All attributes depend only on primary key
- ✅ BCNF: Every determinant is a candidate key

**Benefits**:
- Enable queries like: `WHERE first_name = 'Arjun'`
- Proper sorting: `ORDER BY last_name, first_name`
- No parsing ambiguity
- Better API design

---

## 18. DATABASE TRANSACTIONS IN APPLICATION

### Complex Workflow Example: Student Registration
```javascript
// Demonstrates: Atomicity, Consistency, Isolation
async function registerStudent(req, res) {
  const conn = await pool.getConnection();
  
  try {
    // Step 1: Begin transaction
    await conn.beginTransaction();
    
    // Step 2: Hash password (atomicity requirement)
    const hash = await bcrypt.hash(req.body.password, 10);
    
    // Step 3: Insert user (triggers constraint checking)
    const [userResult] = await conn.query(
      'INSERT INTO users (...) VALUES (...)',
      [req.body.email, hash, 'student', req.body.first_name, req.body.last_name, ...]
    );
    
    // Step 4: Insert student profile (depends on user_id)
    const [stuRes] = await conn.query(
      'INSERT INTO students (...) VALUES (...)',
      [userResult.insertId, req.body.enrollment_no, ...]
    );
    
    // Step 5: Commit on success
    await conn.commit();
    res.json({ success: true });
    
  } catch (error) {
    // Step 6: Rollback on any error
    await conn.rollback();
    res.status(400).json({ error: error.message });
    
  } finally {
    conn.release();
  }
}
```

**ACID Properties Guaranteed**:
1. **Atomicity**: Both user and student created, or neither
2. **Consistency**: Unique constraints checked, foreign keys valid
3. **Isolation**: Other transactions don't see intermediate states
4. **Durability**: After commit, survives crashes

---

## 19. DATABASE DESIGN DECISIONS

### Why MySQL?
- ✅ ACID compliance (InnoDB engine)
- ✅ Strong referential integrity with foreign keys
- ✅ Trigger support for automatic consistency
- ✅ Robust indexing for performance
- ✅ Proven reliability for applications
- ✅ Open-source and widely supported

### Why InnoDB?
- ✅ MVCC for concurrent access
- ✅ Row-level locking (fine-grained control)
- ✅ Foreign key constraints
- ✅ Crash recovery
- ✅ Standard for production databases

### Normalization Trade-offs
```
Benefit:  Improved data integrity
Cost:    Slightly more complex queries (requires JOINs)
Solution: Indexes and query optimization mitigate the cost

Example:
SELECT s.*, u.first_name, u.last_name
FROM students s
JOIN users u ON s.user_id = u.id
-- Index on (s.user_id) makes this efficient
```

---

## 20. ADVANCED CONCEPTS DEMONSTRATED

### 1. **Cascading Deletes**
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- Deleting a user automatically deletes their student profile
-- Maintains referential integrity automatically
```

### 2. **Unique Constraints (Business Rules)**
```sql
UNIQUE KEY uq_student_job (student_id, job_id)
-- Enforces: A student can apply to a job only once
-- Database prevents duplicates at storage level
```

### 3. **Temporal Data Management**
```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- Automatically track when records are created/modified
-- Enable audit trails and point-in-time recovery
```

### 4. **Enum for Domain Constraint**
```sql
status ENUM('applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn')
-- Restricts values at database level
-- More efficient than VARCHAR with application validation
-- Only 1 byte per value vs 20+ bytes
```

---

## Summary Table: DBMS Concepts & Implementation

| Concept | Example | Benefit |
|---------|---------|---------|
| **Normalization** | Separated first_name, last_name | Atomic data, BCNF compliance |
| **Foreign Keys** | user_id in students table | Referential integrity |
| **Indexes** | idx_users_name(last_name, first_name) | Query performance |
| **Triggers** | Auto-update placement_status | Data consistency |
| **Transactions** | BEGIN → INSERT user → INSERT student → COMMIT | All-or-nothing operations |
| **Views** | placement_summary view | Simplified reporting |
| **Constraints** | UNIQUE, NOT NULL, ENUM | Data validation |
| **Enums** | role, status, job_type | Storage efficiency |
| **Cascading Deletes** | ON DELETE CASCADE | Referential integrity |
| **Temporal Data** | created_at, updated_at | Audit trails |
| **Aggregation** | COUNT, AVG, GROUP BY | Analytics |
| **Joins** | Multiple JOIN operations | Normalized data retrieval |
| **ACID Properties** | Transaction handling | Reliability |
| **Backup/Recovery** | Schema preservation | Disaster recovery |
| **MVCC** | InnoDB concurrency | Parallel processing |

---

## Conclusion

PlaceMe demonstrates comprehensive DBMS knowledge covering:
- ✅ Database design and normalization (1NF, 2NF, 3NF, BCNF)
- ✅ Entity-Relationship modeling with proper relationships
- ✅ Referential integrity and constraint management
- ✅ Query optimization through strategic indexing
- ✅ Data consistency via triggers and transactions
- ✅ ACID properties in real-world applications
- ✅ Views for simplified data access
- ✅ Concurrency control and isolation
- ✅ Security through role-based access control
- ✅ Temporal data and audit trails

This project serves as an excellent practical demonstration of advanced DBMS concepts for academic study and professional development.

---

**Document Created**: 2026-04-27  
**Last Updated**: 2026-04-27  
**Status**: Complete for DBMS Report Submission
