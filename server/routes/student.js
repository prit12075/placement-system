const express = require('express');
const pool = require('../config/db');
const { requireStudent } = require('../middleware/auth');

const router = express.Router();
router.use(requireStudent);

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [stu] = await pool.query('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    if (!stu.length) return res.status(404).json({ error: 'Student not found' });
    const student = stu[0];

    const [[{ totalApps }]] = await pool.query('SELECT COUNT(*) AS totalApps FROM applications WHERE student_id = ?', [student.id]);
    const [[{ shortlisted }]] = await pool.query("SELECT COUNT(*) AS shortlisted FROM applications WHERE student_id = ? AND status = 'shortlisted'", [student.id]);
    const [[{ openJobs }]] = await pool.query("SELECT COUNT(*) AS openJobs FROM job_postings WHERE status IN ('upcoming','ongoing') AND deadline >= CURDATE()");

    const [placement] = await pool.query(`
      SELECT p.*, c.name AS company_name, j.role, j.title AS job_title
      FROM placements p
      JOIN job_postings j ON p.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE p.student_id = ? AND p.status = 'confirmed'
    `, [student.id]);

    const [recentApps] = await pool.query(`
      SELECT a.*, j.title AS job_title, j.role, j.package_min, j.package_max, c.name AS company_name
      FROM applications a
      JOIN job_postings j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC LIMIT 5
    `, [student.id]);

    res.json({
      student,
      stats: { totalApps, shortlisted, openJobs },
      placement: placement[0] || null,
      recentApps,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── BROWSE JOBS ──────────────────────────────────────────────────────────
router.get('/jobs', async (req, res) => {
  try {
    const [stu] = await pool.query('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    if (!stu.length) return res.status(404).json({ error: 'Student not found' });
    const student = stu[0];

    // Get all open jobs the student hasn't applied to yet
    const [jobs] = await pool.query(`
      SELECT j.*, c.name AS company_name, c.industry, c.location AS company_location,
             COUNT(a.id) AS application_count,
             EXISTS(SELECT 1 FROM applications a2 WHERE a2.student_id = ? AND a2.job_id = j.id) AS has_applied
      FROM job_postings j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.status IN ('upcoming', 'ongoing')
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `, [student.id]);

    // Mark eligibility for each job
    const result = jobs.map(j => ({
      ...j,
      has_applied: !!j.has_applied,
      is_eligible:
        student.cgpa >= j.min_cgpa &&
        student.tenth_pct >= j.min_tenth &&
        student.twelfth_pct >= j.min_twelfth &&
        student.backlogs <= j.max_backlogs &&
        (j.eligible_departments === 'ALL' || j.eligible_departments.split(',').map(d => d.trim()).includes(student.department)) &&
        student.placement_status === 'unplaced',
    }));

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── APPLY TO JOB ─────────────────────────────────────────────────────────
router.post('/jobs/:id/apply', async (req, res) => {
  try {
    const [stu] = await pool.query('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    if (!stu.length) return res.status(404).json({ error: 'Student not found' });
    const student = stu[0];

    if (student.placement_status === 'placed') {
      return res.status(400).json({ error: 'You are already placed' });
    }

    const [jobs] = await pool.query('SELECT * FROM job_postings WHERE id = ?', [req.params.id]);
    if (!jobs.length) return res.status(404).json({ error: 'Job not found' });
    const job = jobs[0];

    if (!['upcoming', 'ongoing'].includes(job.status)) {
      return res.status(400).json({ error: 'This drive is no longer accepting applications' });
    }

    // Check eligibility
    const depts = job.eligible_departments === 'ALL' ? null : job.eligible_departments.split(',').map(d => d.trim());
    if (student.cgpa < job.min_cgpa) return res.status(400).json({ error: `Minimum CGPA required: ${job.min_cgpa}` });
    if (student.tenth_pct < job.min_tenth) return res.status(400).json({ error: `Minimum 10th % required: ${job.min_tenth}` });
    if (student.twelfth_pct < job.min_twelfth) return res.status(400).json({ error: `Minimum 12th % required: ${job.min_twelfth}` });
    if (student.backlogs > job.max_backlogs) return res.status(400).json({ error: `Maximum backlogs allowed: ${job.max_backlogs}` });
    if (depts && !depts.includes(student.department)) return res.status(400).json({ error: 'Your department is not eligible' });

    const [r] = await pool.query('INSERT INTO applications (student_id, job_id) VALUES(?,?)', [student.id, job.id]);
    res.json({ id: r.insertId, status: 'applied', message: 'Application submitted!' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Already applied to this job' });
    res.status(500).json({ error: e.message });
  }
});

// ─── WITHDRAW APPLICATION ─────────────────────────────────────────────────
router.delete('/applications/:id', async (req, res) => {
  try {
    const [stu] = await pool.query('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    if (!stu.length) return res.status(404).json({ error: 'Student not found' });

    const [apps] = await pool.query("SELECT * FROM applications WHERE id = ? AND student_id = ? AND status = 'applied'", [req.params.id, stu[0].id]);
    if (!apps.length) return res.status(400).json({ error: 'Can only withdraw pending applications' });

    await pool.query('UPDATE applications SET status = ? WHERE id = ?', ['withdrawn', req.params.id]);
    res.json({ success: true, message: 'Application withdrawn' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── MY APPLICATIONS ──────────────────────────────────────────────────────
router.get('/applications', async (req, res) => {
  try {
    const [stu] = await pool.query('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    if (!stu.length) return res.status(404).json({ error: 'Student not found' });

    const [rows] = await pool.query(`
      SELECT a.*, j.title AS job_title, j.role, j.package_min, j.package_max,
             j.location, j.drive_date, c.name AS company_name, c.industry
      FROM applications a
      JOIN job_postings j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC
    `, [stu[0].id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── MY PROFILE ───────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, u.name, u.email, u.phone
      FROM students s JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `, [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, phone, skills, resume_url } = req.body;
    const [stu] = await pool.query('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    if (!stu.length) return res.status(404).json({ error: 'Student not found' });

    if (name) await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);
    await pool.query('UPDATE students SET skills = ?, resume_url = ? WHERE user_id = ?', [skills, resume_url, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────
router.get('/notifications', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
