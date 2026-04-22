const express = require('express');
const { all, one, run, db } = require('../db/database');

const router = express.Router();

router.get('/stats', (_, res) => res.json({
    totalStudents: one("SELECT COUNT(*) c FROM students WHERE status='active'").c,
    totalCompanies: one('SELECT COUNT(*) c FROM companies').c,
    totalDrives: one('SELECT COUNT(*) c FROM drives').c,
    totalPlacements: one('SELECT COUNT(*) c FROM placements').c,
    avgPackage: one('SELECT ROUND(AVG(package),2) avg FROM placements').avg || 0,
    placementRate: (() => {
        const t = one("SELECT COUNT(*) c FROM students WHERE status='active'").c;
        const p = one('SELECT COUNT(*) c FROM placements').c;
        return t > 0 ? ((p / t) * 100).toFixed(1) : 0;
    })(),
    deptStats: all('SELECT * FROM placement_summary ORDER BY total_students DESC'),
    driveStatus: all('SELECT status, COUNT(*) count FROM drives GROUP BY status'),
    recentPlacements: all(`SELECT p.package, p.offer_date, s.name student_name, dep.name department,
    c.name company_name, d.role FROM placements p
    JOIN students s ON p.student_id=s.id 
    JOIN departments dep ON s.department_id = dep.id
    JOIN drives d ON p.drive_id=d.id
    JOIN companies c ON d.company_id=c.id ORDER BY p.created_at DESC LIMIT 6`),
}));


const resolveDepartmentId = (name) => {
    let d = one('SELECT id FROM departments WHERE name=?', name);
    if (!d) {
        d = { id: run('INSERT INTO departments (name) VALUES (?)', name).lastInsertRowid };
    }
    return d.id;
};

const resolveSkillObject = (skillName) => {
    let s = one('SELECT id FROM skills WHERE name=?', skillName);
    if (!s) {
        s = { id: run('INSERT INTO skills (name) VALUES (?)', skillName).lastInsertRowid };
    }
    return s.id;
};

// ─── Students ─────────────────────────────────────────────────────────────────
router.get('/students', (_, res) => {
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
      GROUP BY s.id
      ORDER BY s.name
    `;
    res.json(all(query));
});

router.get('/students/:id', (req, res) => {
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
    const s = one(query, +req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });

    s.applications = all(`SELECT a.*, d.title drive_title, d.role, d.package_min, d.package_max, c.name company_name
    FROM applications a JOIN drives d ON a.drive_id=d.id JOIN companies c ON d.company_id=c.id
    WHERE a.student_id=?`, +req.params.id);

    s.placement = one(`SELECT p.*, c.name company_name, d.role FROM placements p
    JOIN drives d ON p.drive_id=d.id JOIN companies c ON d.company_id=c.id WHERE p.student_id=?`, +req.params.id);

    res.json(s);
});

router.post('/students', (req, res) => {
    const { name, email, phone, department, cgpa, year, skills } = req.body;
    try {
        const transaction = db.transaction(() => {
            const deptId = resolveDepartmentId(department);
            const r = run('INSERT INTO students (name,phone,department_id,cgpa,year,status) VALUES (?,?,?,?,?,?)', name, phone, deptId, +cgpa || 0, +year || 4, 'active');
            const sid = r.lastInsertRowid;

            if (skills) {
                skills.split(',').forEach(sk => {
                    const skStr = sk.trim();
                    if (skStr) {
                        const skid = resolveSkillObject(skStr);
                        run('INSERT OR IGNORE INTO student_skills (student_id, skill_id) VALUES (?,?)', sid, skid);
                    }
                });
            }
            run('INSERT INTO users (email, password, role, student_id) VALUES (?, ?, ?, ?)', email, 'student123', 'student', sid);
            return sid;
        });

        const resultId = transaction();
        res.json({ id: resultId, ...req.body, status: 'active' });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/students/:id', (req, res) => {
    const { name, email, phone, department, cgpa, year, skills, status } = req.body;
    const sid = +req.params.id;
    try {
        db.transaction(() => {
            const deptId = resolveDepartmentId(department);
            run('UPDATE students SET name=?,phone=?,department_id=?,cgpa=?,year=?,status=? WHERE id=?',
                name, phone, deptId, +cgpa, +year, status || 'active', sid);

            run('UPDATE users SET email=? WHERE student_id=?', email, sid);

            run('DELETE FROM student_skills WHERE student_id=?', sid);
            if (skills) {
                skills.split(',').forEach(sk => {
                    const skStr = sk.trim();
                    if (skStr) {
                        const skid = resolveSkillObject(skStr);
                        run('INSERT OR IGNORE INTO student_skills (student_id, skill_id) VALUES (?,?)', sid, skid);
                    }
                });
            }
        })();
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/students/:id', (req, res) => { run('DELETE FROM students WHERE id=?', +req.params.id); res.json({ success: true }); });

// ─── Companies ────────────────────────────────────────────────────────────────
router.get('/companies', (_, res) => res.json(all(`
  SELECT c.*, COUNT(DISTINCT d.id) total_drives, COUNT(DISTINCT p.student_id) total_placed
  FROM companies c LEFT JOIN drives d ON c.id=d.company_id LEFT JOIN placements p ON d.id=p.drive_id
  GROUP BY c.id ORDER BY c.name`)));

router.post('/companies', (req, res) => {
    const { name, email, website, industry, description } = req.body;
    try {
        const r = run('INSERT INTO companies (name,email,website,industry,description) VALUES (?,?,?,?,?)', name, email, website, industry, description);
        res.json({ id: r.lastInsertRowid, ...req.body });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/companies/:id', (req, res) => {
    const { name, email, website, industry, description } = req.body;
    run('UPDATE companies SET name=?,email=?,website=?,industry=?,description=? WHERE id=?', name, email, website, industry, description, +req.params.id);
    res.json({ success: true });
});

router.delete('/companies/:id', (req, res) => { run('DELETE FROM companies WHERE id=?', +req.params.id); res.json({ success: true }); });

// ─── Drives ───────────────────────────────────────────────────────────────────
router.get('/drives', (_, res) => res.json(all(`
  SELECT d.id, d.title, d.role, d.package_min, d.package_max, d.location, 
         d.drive_date, d.deadline, d.min_cgpa, d.positions, d.status, d.description, d.created_at,
         c.id AS company_id, c.name AS company_name, c.industry, 
         COUNT(DISTINCT a.id) AS application_count,
         IFNULL(GROUP_CONCAT(DISTINCT dep.name), '') AS eligible_departments
  FROM drives d 
  LEFT JOIN companies c ON d.company_id=c.id 
  LEFT JOIN applications a ON d.id=a.drive_id
  LEFT JOIN drive_departments dd ON dd.drive_id=d.id
  LEFT JOIN departments dep ON dep.id=dd.department_id
  GROUP BY d.id 
  ORDER BY d.created_at DESC`)));

router.post('/drives', (req, res) => {
    const { company_id, title, role, package_min, package_max, location, drive_date, deadline, min_cgpa, eligible_departments, positions, status, description } = req.body;
    try {
        db.transaction(() => {
            const r = run('INSERT INTO drives (company_id,title,role,package_min,package_max,location,drive_date,deadline,min_cgpa,positions,status,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                +company_id, title, role, +package_min, +package_max, location, drive_date, deadline, +min_cgpa, +positions, status || 'upcoming', description);

            const did = r.lastInsertRowid;

            if (eligible_departments && eligible_departments !== 'ALL') {
                eligible_departments.split(',').forEach(dep => {
                    const dStr = dep.trim();
                    if (dStr) {
                        const depId = resolveDepartmentId(dStr);
                        run('INSERT OR IGNORE INTO drive_departments (drive_id, department_id) VALUES (?,?)', did, depId);
                    }
                });
            } else if (eligible_departments === 'ALL') {
                all('SELECT id FROM departments').forEach(d => {
                    run('INSERT OR IGNORE INTO drive_departments (drive_id, department_id) VALUES (?,?)', did, d.id);
                });
            }
            return did;
        })();
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/drives/:id', (req, res) => {
    const { company_id, title, role, package_min, package_max, location, drive_date, deadline, min_cgpa, eligible_departments, positions, status, description } = req.body;
    const did = +req.params.id;
    try {
        db.transaction(() => {
            run('UPDATE drives SET company_id=?,title=?,role=?,package_min=?,package_max=?,location=?,drive_date=?,deadline=?,min_cgpa=?,positions=?,status=?,description=? WHERE id=?',
                +company_id, title, role, +package_min, +package_max, location, drive_date, deadline, +min_cgpa, +positions, status, description, did);

            run('DELETE FROM drive_departments WHERE drive_id=?', did);

            if (eligible_departments && eligible_departments !== 'ALL') {
                eligible_departments.split(',').forEach(dep => {
                    const dStr = dep.trim();
                    if (dStr) {
                        const depId = resolveDepartmentId(dStr);
                        run('INSERT OR IGNORE INTO drive_departments (drive_id, department_id) VALUES (?,?)', did, depId);
                    }
                });
            } else if (eligible_departments === 'ALL') {
                all('SELECT id FROM departments').forEach(d => {
                    run('INSERT OR IGNORE INTO drive_departments (drive_id, department_id) VALUES (?,?)', did, d.id);
                });
            }
        })();
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/drives/:id', (req, res) => { run('DELETE FROM drives WHERE id=?', +req.params.id); res.json({ success: true }); });

// ─── Applications ─────────────────────────────────────────────────────────────
router.get('/applications', (_, res) => res.json(all(`
  SELECT a.*, s.name student_name, dep.name department, s.cgpa,
         d.title drive_title, d.role, d.package_min, d.package_max, c.name company_name
  FROM applications a 
  JOIN students s ON a.student_id=s.id
  JOIN departments dep ON s.department_id=dep.id
  JOIN drives d ON a.drive_id=d.id 
  JOIN companies c ON d.company_id=c.id
  ORDER BY a.applied_at DESC`)));

router.post('/applications', (req, res) => {
    try {
        const r = run('INSERT INTO applications (student_id,drive_id) VALUES (?,?)', +req.body.student_id, +req.body.drive_id);
        res.json({ id: r.lastInsertRowid, ...req.body, status: 'applied' });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/applications/:id', (req, res) => {
    run('UPDATE applications SET status=?,notes=? WHERE id=?', req.body.status, req.body.notes || '', +req.params.id);
    res.json({ success: true });
});

router.delete('/applications/:id', (req, res) => { run('DELETE FROM applications WHERE id=?', +req.params.id); res.json({ success: true }); });

// ─── Placements ───────────────────────────────────────────────────────────────
router.get('/placements', (_, res) => res.json(all(`
  SELECT p.*, s.name student_name, dep.name department, s.cgpa, u.email student_email,
         d.title drive_title, d.role, c.name company_name
  FROM placements p 
  JOIN students s ON p.student_id=s.id
  JOIN users u ON u.student_id=s.id
  JOIN departments dep ON s.department_id=dep.id
  JOIN drives d ON p.drive_id=d.id 
  JOIN companies c ON d.company_id=c.id
  ORDER BY p.created_at DESC`)));

router.post('/placements', (req, res) => {
    const { student_id, drive_id, package: pkg, offer_date, joining_date } = req.body;
    try {
        const r = run('INSERT INTO placements (student_id,drive_id,package,offer_date,joining_date) VALUES (?,?,?,?,?)',
            +student_id, +drive_id, +pkg, offer_date, joining_date);
        run("UPDATE applications SET status='selected' WHERE student_id=? AND drive_id=?", +student_id, +drive_id);
        res.json({ id: r.lastInsertRowid, ...req.body });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/placements/:id', (req, res) => { run('DELETE FROM placements WHERE id=?', +req.params.id); res.json({ success: true }); });

// ─── Eligible Students ────────────────────────────────────────────────────────
router.get('/drives/:id/eligible', (req, res) => {
    const query = `
      SELECT s.id, s.name, s.cgpa, dep.name AS department
      FROM students s
      JOIN departments dep ON s.department_id = dep.id
      JOIN drive_departments dd ON dd.department_id = s.department_id
      JOIN drives d ON d.id = dd.drive_id
      WHERE d.id = ?
        AND s.status='active' AND s.cgpa >= d.min_cgpa
        AND NOT EXISTS (SELECT 1 FROM placements p WHERE p.student_id=s.id)
        AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.student_id=s.id AND a.drive_id=d.id)
      GROUP BY s.id
    `;
    res.json(all(query, +req.params.id));
});

module.exports = router;
