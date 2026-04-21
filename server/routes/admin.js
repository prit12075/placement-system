const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) AS totalStudents FROM students');
    const [[{ totalCompanies }]] = await pool.query('SELECT COUNT(*) AS totalCompanies FROM companies');
    const [[{ totalJobs }]] = await pool.query('SELECT COUNT(*) AS totalJobs FROM job_postings');
    const [[{ totalPlacements }]] = await pool.query("SELECT COUNT(*) AS totalPlacements FROM placements WHERE status='confirmed'");
    const [[{ avgPackage }]] = await pool.query("SELECT COALESCE(ROUND(AVG(package),2),0) AS avgPackage FROM placements WHERE status='confirmed'");
    const [[{ maxPackage }]] = await pool.query("SELECT COALESCE(MAX(package),0) AS maxPackage FROM placements WHERE status='confirmed'");

    const rate = totalStudents > 0 ? ((totalPlacements / totalStudents) * 100).toFixed(1) : 0;

    const [deptStats] = await pool.query('SELECT * FROM placement_summary ORDER BY total_students DESC');
    const [jobStatus] = await pool.query('SELECT status, COUNT(*) AS count FROM job_postings GROUP BY status');
    const [recentPlacements] = await pool.query(`
      SELECT p.package, p.offer_date, u.name AS student_name, s.department,
             c.name AS company_name, j.role
      FROM placements p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN job_postings j ON p.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE p.status = 'confirmed'
      ORDER BY p.created_at DESC LIMIT 6
    `);

    res.json({ totalStudents, totalCompanies, totalJobs, totalPlacements, avgPackage, maxPackage, placementRate: rate, deptStats, jobStatus, recentPlacements });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── STUDENTS ─────────────────────────────────────────────────────────────
router.get('/students', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, u.name, u.email, u.phone, u.is_active
      FROM students s JOIN users u ON s.user_id = u.id
      ORDER BY u.name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, u.name, u.email, u.phone, u.is_active
      FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const student = rows[0];
    const [apps] = await pool.query(`
      SELECT a.*, j.title AS job_title, j.role, j.package_min, j.package_max, c.name AS company_name
      FROM applications a
      JOIN job_postings j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.student_id = ?
    `, [student.id]);
    const [placement] = await pool.query(`
      SELECT p.*, c.name AS company_name, j.role
      FROM placements p
      JOIN job_postings j ON p.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE p.student_id = ?
    `, [student.id]);

    student.applications = apps;
    student.placement = placement[0] || null;
    res.json(student);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/students', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { name, email, phone, password, enrollment_no, department, batch_year, cgpa, tenth_pct, twelfth_pct, backlogs, skills } = req.body;
    if (!name || !email || !password || !enrollment_no || !department || !batch_year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const hash = await bcrypt.hash(password, 10);
    await conn.beginTransaction();
    const [userRes] = await conn.query('INSERT INTO users (email,password,role,name,phone) VALUES(?,?,?,?,?)', [email, hash, 'student', name, phone || null]);
    const [stuRes] = await conn.query(
      'INSERT INTO students (user_id,enrollment_no,department,batch_year,cgpa,tenth_pct,twelfth_pct,backlogs,skills) VALUES(?,?,?,?,?,?,?,?,?)',
      [userRes.insertId, enrollment_no, department, +batch_year, +(cgpa || 0), +(tenth_pct || 0), +(twelfth_pct || 0), +(backlogs || 0), skills || null]
    );
    await conn.commit();
    res.json({ id: stuRes.insertId, name, email });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email or enrollment already exists' });
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

router.put('/students/:id', async (req, res) => {
  try {
    const { name, phone, department, batch_year, cgpa, tenth_pct, twelfth_pct, backlogs, skills, is_active } = req.body;
    const [stu] = await pool.query('SELECT user_id FROM students WHERE id = ?', [req.params.id]);
    if (!stu.length) return res.status(404).json({ error: 'Not found' });

    await pool.query('UPDATE users SET name=?, phone=?, is_active=? WHERE id=?', [name, phone, is_active !== false, stu[0].user_id]);
    await pool.query('UPDATE students SET department=?,batch_year=?,cgpa=?,tenth_pct=?,twelfth_pct=?,backlogs=?,skills=? WHERE id=?',
      [department, +batch_year, +(cgpa || 0), +(tenth_pct || 0), +(twelfth_pct || 0), +(backlogs || 0), skills, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const [stu] = await pool.query('SELECT user_id FROM students WHERE id = ?', [req.params.id]);
    if (!stu.length) return res.status(404).json({ error: 'Not found' });
    await pool.query('DELETE FROM users WHERE id = ?', [stu[0].user_id]); // cascades
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── COMPANIES ────────────────────────────────────────────────────────────
router.get('/companies', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(DISTINCT j.id) AS total_jobs,
             COUNT(DISTINCT p.student_id) AS total_placed
      FROM companies c
      LEFT JOIN job_postings j ON c.id = j.company_id
      LEFT JOIN placements p ON j.id = p.job_id AND p.status='confirmed'
      GROUP BY c.id ORDER BY c.name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/companies', async (req, res) => {
  try {
    const { name, email, website, industry, description, location } = req.body;
    if (!name) return res.status(400).json({ error: 'Company name required' });
    const [r] = await pool.query('INSERT INTO companies (name,email,website,industry,description,location) VALUES(?,?,?,?,?,?)',
      [name, email, website, industry, description, location]);
    res.json({ id: r.insertId, ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/companies/:id', async (req, res) => {
  try {
    const { name, email, website, industry, description, location } = req.body;
    await pool.query('UPDATE companies SET name=?,email=?,website=?,industry=?,description=?,location=? WHERE id=?',
      [name, email, website, industry, description, location, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/companies/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM companies WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── JOB POSTINGS ─────────────────────────────────────────────────────────
router.get('/jobs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT j.*, c.name AS company_name, c.industry,
             COUNT(a.id) AS application_count
      FROM job_postings j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN applications a ON j.id = a.job_id
      GROUP BY j.id ORDER BY j.created_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/jobs', async (req, res) => {
  try {
    const { company_id, title, description, role, job_type, package_min, package_max, location, drive_date, deadline, min_cgpa, min_tenth, min_twelfth, max_backlogs, eligible_departments, positions, skills_required, status } = req.body;
    if (!company_id || !title) return res.status(400).json({ error: 'Company and title required' });
    const [r] = await pool.query(
      `INSERT INTO job_postings (company_id,title,description,role,job_type,package_min,package_max,location,drive_date,deadline,min_cgpa,min_tenth,min_twelfth,max_backlogs,eligible_departments,positions,skills_required,status,created_by)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [+company_id, title, description, role, job_type || 'full-time', +(package_min || 0), +(package_max || 0), location, drive_date || null, deadline || null, +(min_cgpa || 0), +(min_tenth || 0), +(min_twelfth || 0), +(max_backlogs || 0), eligible_departments || 'ALL', +(positions || 1), skills_required, status || 'upcoming', req.user.id]
    );
    res.json({ id: r.insertId, ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/jobs/:id', async (req, res) => {
  try {
    const { company_id, title, description, role, job_type, package_min, package_max, location, drive_date, deadline, min_cgpa, min_tenth, min_twelfth, max_backlogs, eligible_departments, positions, skills_required, status } = req.body;
    await pool.query(
      `UPDATE job_postings SET company_id=?,title=?,description=?,role=?,job_type=?,package_min=?,package_max=?,location=?,drive_date=?,deadline=?,min_cgpa=?,min_tenth=?,min_twelfth=?,max_backlogs=?,eligible_departments=?,positions=?,skills_required=?,status=? WHERE id=?`,
      [+company_id, title, description, role, job_type, +(package_min || 0), +(package_max || 0), location, drive_date || null, deadline || null, +(min_cgpa || 0), +(min_tenth || 0), +(min_twelfth || 0), +(max_backlogs || 0), eligible_departments, +(positions || 1), skills_required, status, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM job_postings WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Eligible students for a job
router.get('/jobs/:id/eligible', async (req, res) => {
  try {
    const [jobs] = await pool.query('SELECT * FROM job_postings WHERE id = ?', [req.params.id]);
    if (!jobs.length) return res.status(404).json({ error: 'Not found' });
    const job = jobs[0];
    const depts = job.eligible_departments === 'ALL' ? null : job.eligible_departments.split(',').map(d => d.trim());

    let q = `SELECT s.*, u.name, u.email FROM students s JOIN users u ON s.user_id = u.id
             WHERE s.placement_status = 'unplaced' AND s.cgpa >= ? AND s.tenth_pct >= ? AND s.twelfth_pct >= ? AND s.backlogs <= ?
             AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id AND a.job_id = ?)`;
    const params = [job.min_cgpa, job.min_tenth, job.min_twelfth, job.max_backlogs, job.id];

    if (depts) {
      q += ` AND s.department IN (${depts.map(() => '?').join(',')})`;
      params.push(...depts);
    }
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── APPLICATIONS ─────────────────────────────────────────────────────────
router.get('/applications', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.name AS student_name, s.department, s.cgpa,
             j.title AS job_title, j.role, j.package_min, j.package_max,
             c.name AS company_name
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN job_postings j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ORDER BY a.applied_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/applications', async (req, res) => {
  try {
    const { student_id, job_id } = req.body;
    const [r] = await pool.query('INSERT INTO applications (student_id, job_id) VALUES(?,?)', [+student_id, +job_id]);
    res.json({ id: r.insertId, student_id, job_id, status: 'applied' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Already applied' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/applications/:id', async (req, res) => {
  try {
    await pool.query('UPDATE applications SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/applications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM applications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PLACEMENTS ───────────────────────────────────────────────────────────
router.get('/placements', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name AS student_name, u.email AS student_email, s.department, s.cgpa,
             j.title AS job_title, j.role, c.name AS company_name
      FROM placements p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN job_postings j ON p.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/placements', async (req, res) => {
  try {
    const { student_id, job_id, application_id, package: pkg, offer_date, joining_date } = req.body;
    if (!student_id || !job_id || !pkg) return res.status(400).json({ error: 'Missing required fields' });
    const [r] = await pool.query(
      'INSERT INTO placements (student_id,job_id,application_id,package,offer_date,joining_date) VALUES(?,?,?,?,?,?)',
      [+student_id, +job_id, application_id ? +application_id : null, +pkg, offer_date || null, joining_date || null]
    );
    res.json({ id: r.insertId, ...req.body });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Student already placed' });
    res.status(500).json({ error: e.message });
  }
});

router.delete('/placements/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM placements WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────
router.post('/notifications', async (req, res) => {
  try {
    const { user_id, title, message, type, link } = req.body;
    const [r] = await pool.query('INSERT INTO notifications (user_id,title,message,type,link) VALUES(?,?,?,?,?)',
      [user_id, title, message, type || 'info', link]);
    res.json({ id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
