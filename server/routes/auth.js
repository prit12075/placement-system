const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = generateToken(user);

    // Get student profile if student
    let student = null;
    if (user.role === 'student') {
      const [rows] = await pool.query('SELECT * FROM students WHERE user_id = ?', [user.id]);
      student = rows[0] || null;
    }

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name, phone: user.phone },
      student,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/register (student self-registration)
router.post('/register', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { first_name, last_name, email, password, phone, enrollment_no, department, batch_year, cgpa, tenth_pct, twelfth_pct } = req.body;
    if (!first_name || !last_name || !email || !password || !enrollment_no || !department || !batch_year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hash = await bcrypt.hash(password, 10);

    await conn.beginTransaction();

    const [userResult] = await conn.query(
      'INSERT INTO users (email, password, role, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hash, 'student', first_name, last_name, phone || null]
    );

    await conn.query(
      `INSERT INTO students (user_id, enrollment_no, department, batch_year, cgpa, tenth_pct, twelfth_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, enrollment_no, department, +batch_year, +(cgpa || 0), +(tenth_pct || 0), +(twelfth_pct || 0)]
    );

    await conn.commit();

    const token = generateToken({ id: userResult.insertId, email, role: 'student', first_name, last_name });
    res.json({ token, user: { id: userResult.insertId, email, role: 'student', first_name, last_name } });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email or enrollment number already exists' });
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, role, first_name, last_name, phone, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    let student = null;
    if (user.role === 'student') {
      const [rows] = await pool.query('SELECT * FROM students WHERE user_id = ?', [user.id]);
      student = rows[0] || null;
    }

    res.json({ user, student });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
