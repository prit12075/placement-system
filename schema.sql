-- ═══════════════════════════════════════════════════════════════════════════
-- PlaceMe — Placement Management System
-- MySQL Schema (DDL)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS placeme;
USE placeme;

-- ─── USERS (base auth table) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'student') NOT NULL DEFAULT 'student',
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(20),
  is_active   BOOLEAN DEFAULT TRUE,
  last_login  TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- ─── STUDENTS (extends users) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL UNIQUE,
  enrollment_no    VARCHAR(30) NOT NULL UNIQUE,
  department       VARCHAR(50) NOT NULL,
  batch_year       INT NOT NULL,
  cgpa             DECIMAL(4,2) DEFAULT 0.00,
  tenth_pct        DECIMAL(5,2) DEFAULT 0.00,
  twelfth_pct      DECIMAL(5,2) DEFAULT 0.00,
  backlogs         INT DEFAULT 0,
  skills           TEXT,
  resume_url       VARCHAR(500),
  placement_status ENUM('unplaced', 'placed') DEFAULT 'unplaced',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_students_dept (department),
  INDEX idx_students_batch (batch_year),
  INDEX idx_students_status (placement_status)
) ENGINE=InnoDB;

-- ─── COMPANIES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(255),
  website     VARCHAR(255),
  industry    VARCHAR(100),
  description TEXT,
  location    VARCHAR(200),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── JOB POSTINGS (drives) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  company_id           INT NOT NULL,
  title                VARCHAR(200) NOT NULL,
  description          TEXT,
  role                 VARCHAR(100),
  job_type             ENUM('full-time', 'internship') DEFAULT 'full-time',
  package_min          DECIMAL(6,2) DEFAULT 0.00,
  package_max          DECIMAL(6,2) DEFAULT 0.00,
  location             VARCHAR(200),
  drive_date           DATE,
  deadline             DATE,
  min_cgpa             DECIMAL(4,2) DEFAULT 0.00,
  min_tenth            DECIMAL(5,2) DEFAULT 0.00,
  min_twelfth          DECIMAL(5,2) DEFAULT 0.00,
  max_backlogs         INT DEFAULT 0,
  eligible_departments VARCHAR(500) DEFAULT 'ALL',
  positions            INT DEFAULT 1,
  skills_required      TEXT,
  status               ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
  created_by           INT,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_company (company_id),
  INDEX idx_jobs_deadline (deadline)
) ENGINE=InnoDB;

-- ─── APPLICATIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  job_id      INT NOT NULL,
  status      ENUM('applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn') DEFAULT 'applied',
  applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_job (student_id, job_id),
  INDEX idx_app_status (status)
) ENGINE=InnoDB;

-- ─── PLACEMENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS placements (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL UNIQUE,
  job_id         INT NOT NULL,
  application_id INT,
  package        DECIMAL(6,2) NOT NULL,
  offer_date     DATE,
  joining_date   DATE,
  status         ENUM('confirmed', 'revoked') DEFAULT 'confirmed',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
  INDEX idx_placement_job (job_id)
) ENGINE=InnoDB;

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT,
  type       ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  link       VARCHAR(500),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_read (is_read)
) ENGINE=InnoDB;

-- ─── VIEW: placement_summary ──────────────────────────────────────────────
CREATE OR REPLACE VIEW placement_summary AS
  SELECT
    s.department,
    COUNT(DISTINCT s.id)          AS total_students,
    COUNT(DISTINCT p.student_id)  AS placed_students,
    ROUND(AVG(p.package), 2)      AS avg_package,
    MAX(p.package)                 AS max_package,
    MIN(p.package)                 AS min_package
  FROM students s
  LEFT JOIN placements p ON s.id = p.student_id AND p.status = 'confirmed'
  GROUP BY s.department;

-- ─── TRIGGER: update placement_status after insert ────────────────────────
DELIMITER //
CREATE TRIGGER after_placement_insert
AFTER INSERT ON placements
FOR EACH ROW
BEGIN
  UPDATE students SET placement_status = 'placed' WHERE id = NEW.student_id;
  UPDATE applications SET status = 'selected' WHERE id = NEW.application_id;
END//

CREATE TRIGGER after_placement_delete
AFTER DELETE ON placements
FOR EACH ROW
BEGIN
  UPDATE students SET placement_status = 'unplaced' WHERE id = OLD.student_id;
END//
DELIMITER ;
