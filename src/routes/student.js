const express = require('express');
const { all, one, run } = require('../db/database');

const router = express.Router();

router.get('/profile/:id', (req, res) => {
  const query = `
      SELECT s.id, s.name, s.phone, s.cgpa, s.year, s.status, s.created_at,
             d.name AS department,
             u.email AS email,
             IFNULL(GROUP_CONCAT(sk.name, ','), '') AS skills
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN users u ON u.student_id = s.id AND u.role='student'
      LEFT JOIN student_skills ss ON ss.student_id = s.id
      LEFT JOIN skills sk ON ss.skill_id = sk.id
      WHERE s.id = ?
      GROUP BY s.id
    `;

  const student = one(query, +req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });

  student.applications = all(`
    SELECT a.*, d.title drive_title, d.role, d.package_min, d.package_max, c.name company_name
    FROM applications a 
    JOIN drives d ON a.drive_id=d.id 
    JOIN companies c ON d.company_id=c.id
    WHERE a.student_id=?
    ORDER BY a.applied_at DESC
  `, +req.params.id);

  student.placement = one(`
    SELECT p.*, c.name company_name, d.role 
    FROM placements p
    JOIN drives d ON p.drive_id=d.id 
    JOIN companies c ON d.company_id=c.id 
    WHERE p.student_id=?
  `, +req.params.id);

  res.json(student);
});

// Update the student's isolated profile specifics locally
router.put('/profile/:id', (req, res) => {
  const { name, phone, skills } = req.body;
  const sid = +req.params.id;
  try {
    db.transaction(() => {
      if (name || phone) {
        run('UPDATE students SET name=COALESCE(?, name), phone=COALESCE(?, phone) WHERE id=?', name, phone, sid);
      }
      if (skills !== undefined) {
        run('DELETE FROM student_skills WHERE student_id=?', sid);
        skills.split(',').forEach(sk => {
          const skStr = sk.trim();
          if (skStr) {
            let sObj = one('SELECT id FROM skills WHERE name=?', skStr);
            if (!sObj) sObj = { id: run('INSERT INTO skills (name) VALUES (?)', skStr).lastInsertRowid };
            run('INSERT OR IGNORE INTO student_skills (student_id, skill_id) VALUES (?,?)', sid, sObj.id);
          }
        });
      }
    })();
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/drives/eligible/:student_id', (req, res) => {
  const s = one('SELECT s.*, d.name as department FROM students s JOIN departments d ON d.id=s.department_id WHERE s.id=?', +req.params.student_id);
  if (!s) return res.status(404).json({ error: 'Student not found' });

  const p = one('SELECT 1 FROM placements WHERE student_id=?', s.id);
  if (p) return res.json([]);

  const drives = all(`
    SELECT d.id, d.title, d.role, d.package_min, d.package_max, d.location, 
           d.drive_date, d.deadline, d.min_cgpa, d.positions, d.status, d.description, d.created_at,
           c.id AS company_id, c.name AS company_name, c.industry 
    FROM drives d 
    JOIN companies c ON d.company_id=c.id
    JOIN drive_departments dd ON dd.drive_id=d.id
    WHERE dd.department_id = ?
      AND d.status IN ('upcoming', 'ongoing') 
      AND d.min_cgpa <= ?
      AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.student_id=? AND a.drive_id=d.id)
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `, s.department_id, s.cgpa, s.id);

  res.json(drives);
});

router.post('/apply', (req, res) => {
  const { student_id, drive_id } = req.body;
  if (!student_id || !drive_id) return res.status(400).json({ error: 'Missing logic' });

  try {
    const r = run('INSERT INTO applications (student_id,drive_id) VALUES (?,?)', +student_id, +drive_id);
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Already applied' });
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
