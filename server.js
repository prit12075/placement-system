const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const app = express();
const db = new DatabaseSync(path.join(__dirname, 'placement.db'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS companies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT,
    website     TEXT,
    industry    TEXT,
    description TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT,
    department  TEXT,
    cgpa        REAL DEFAULT 0,
    year        INTEGER DEFAULT 4,
    skills      TEXT,
    status      TEXT DEFAULT 'active',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS drives (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id           INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    title                TEXT NOT NULL,
    role                 TEXT,
    package_min          REAL DEFAULT 0,
    package_max          REAL DEFAULT 0,
    location             TEXT,
    drive_date           TEXT,
    deadline             TEXT,
    min_cgpa             REAL DEFAULT 0,
    eligible_departments TEXT DEFAULT 'ALL',
    positions            INTEGER DEFAULT 1,
    status               TEXT DEFAULT 'upcoming',
    description          TEXT,
    created_at           TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    drive_id   INTEGER REFERENCES drives(id) ON DELETE CASCADE,
    status     TEXT DEFAULT 'applied',
    notes      TEXT,
    applied_at TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id, drive_id)
  );

  CREATE TABLE IF NOT EXISTS placements (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id   INTEGER REFERENCES students(id),
    drive_id     INTEGER REFERENCES drives(id),
    package      REAL,
    offer_date   TEXT,
    joining_date TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id)
  );

  CREATE VIEW IF NOT EXISTS placement_summary AS
    SELECT s.department,
           COUNT(DISTINCT s.id)         AS total_students,
           COUNT(DISTINCT p.student_id) AS placed_students,
           ROUND(AVG(p.package), 2)     AS avg_package,
           MAX(p.package)               AS max_package
    FROM   students s
    LEFT JOIN placements p ON s.id = p.student_id
    GROUP  BY s.department;
`);

// ─── Seed ─────────────────────────────────────────────────────────────────────
if (!db.prepare('SELECT 1 FROM companies LIMIT 1').get()) {
  const iC = db.prepare('INSERT INTO companies (name,email,website,industry,description) VALUES (?,?,?,?,?)');
  const iS = db.prepare('INSERT INTO students (name,email,phone,department,cgpa,year,skills) VALUES (?,?,?,?,?,?,?)');
  const iD = db.prepare('INSERT INTO drives (company_id,title,role,package_min,package_max,location,drive_date,deadline,min_cgpa,eligible_departments,positions,status,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const iA = db.prepare('INSERT OR IGNORE INTO applications (student_id,drive_id,status) VALUES (?,?,?)');
  const iP = db.prepare('INSERT OR IGNORE INTO placements (student_id,drive_id,package,offer_date,joining_date) VALUES (?,?,?,?,?)');

  const dayOffset = n => new Date(Date.now()+n*864e5).toISOString().slice(0,10);

  const c = [
    iC.run('Google','campus@google.com','google.com','Technology','World\'s leading technology company').lastInsertRowid,
    iC.run('Microsoft','campus@microsoft.com','microsoft.com','Technology','Enterprise software & cloud giant').lastInsertRowid,
    iC.run('Amazon','campus@amazon.com','amazon.com','E-Commerce / Cloud','AWS & global e-commerce leader').lastInsertRowid,
    iC.run('TCS','campus@tcs.com','tcs.com','IT Services','India\'s largest IT services company').lastInsertRowid,
    iC.run('Infosys','campus@infosys.com','infosys.com','IT Services','Global digital services company').lastInsertRowid,
    iC.run('Accenture','campus@accenture.com','accenture.com','Consulting','Global professional services company').lastInsertRowid,
  ];

  const s = [
    ['Arjun Sharma','arjun@college.edu','9876543201','CSE',8.9,4,'Python,React,Node.js'],
    ['Priya Patel','priya@college.edu','9876543202','CSE',9.2,4,'Java,Spring,AWS'],
    ['Rahul Singh','rahul@college.edu','9876543203','ECE',7.8,4,'C,Embedded,VLSI'],
    ['Sneha Iyer','sneha@college.edu','9876543204','CSE',8.5,4,'ML,Python,TensorFlow'],
    ['Vikram Nair','vikram@college.edu','9876543205','Mechanical',7.5,4,'AutoCAD,SolidWorks'],
    ['Ananya Roy','ananya@college.edu','9876543206','CSE',9.0,4,'JavaScript,Vue,Firebase'],
    ['Karthik Reddy','karthik@college.edu','9876543207','ECE',8.2,4,'IoT,Arduino,Python'],
    ['Divya Krishnan','divya@college.edu','9876543208','CSE',7.9,4,'PHP,MySQL,Laravel'],
    ['Rohan Mehta','rohan@college.edu','9876543209','Civil',7.6,4,'AutoCAD,STAAD Pro'],
    ['Meera Gupta','meera@college.edu','9876543210','CSE',9.4,4,'Data Science,R,Python'],
    ['Aditya Kumar','aditya@college.edu','9876543211','EEE',8.1,4,'Power Systems,MATLAB'],
    ['Pooja Desai','pooja@college.edu','9876543212','CSE',8.7,4,'Android,Kotlin,Flutter'],
    ['Siddharth Joshi','siddharth@college.edu','9876543213','CSE',7.7,4,'DevOps,Docker,K8s'],
    ['Kavya Bhat','kavya@college.edu','9876543214','ECE',8.4,4,'Signal Processing,MATLAB'],
    ['Nikhil Verma','nikhil@college.edu','9876543215','CSE',9.1,4,'Blockchain,Solidity,Web3'],
  ].map(r => iS.run(...r).lastInsertRowid);

  const d = [
    iD.run(c[0],'Google SWE Campus','Software Engineer',18,25,'Bangalore','2024-03-15','2024-02-28',8.0,'CSE',5,'completed','Full-time SWE role at Google Bangalore').lastInsertRowid,
    iD.run(c[1],'Microsoft SDE Drive','Software Developer',20,30,'Hyderabad','2024-04-10','2024-03-25',7.5,'CSE,ECE',8,'completed','SDE-1 role at Microsoft Hyderabad').lastInsertRowid,
    iD.run(c[2],'Amazon SDE-1 Hiring','Software Developer',22,28,'Bangalore',dayOffset(30),dayOffset(15),8.0,'CSE',6,'ongoing','SDE-1 at Amazon Bangalore').lastInsertRowid,
    iD.run(c[3],'TCS Ninja 2024','Systems Engineer',3.5,4.5,'Multiple',dayOffset(20),dayOffset(8),6.5,'ALL',30,'upcoming','Mass recruitment for all branches').lastInsertRowid,
    iD.run(c[4],'Infosys Power Programmer','Software Engineer',6,8,'Pune',dayOffset(25),dayOffset(12),7.0,'CSE,ECE,EEE',15,'upcoming','Elite programmer track at Infosys').lastInsertRowid,
    iD.run(c[5],'Accenture ASE Batch','Associate Eng.',4.5,6.5,'Mumbai',dayOffset(35),dayOffset(20),7.0,'ALL',20,'upcoming','Associate Software Engineer batch').lastInsertRowid,
  ];

  [[s[0],d[0],'selected'],[s[1],d[0],'selected'],[s[3],d[0],'rejected'],[s[5],d[0],'selected'],[s[9],d[0],'selected'],
   [s[2],d[1],'selected'],[s[6],d[1],'selected'],[s[12],d[1],'selected'],[s[1],d[1],'rejected'],
   [s[3],d[2],'applied'],[s[7],d[2],'applied'],[s[11],d[2],'applied'],[s[14],d[2],'shortlisted'],
   [s[4],d[3],'applied'],[s[8],d[3],'applied'],[s[10],d[4],'applied'],[s[13],d[4],'applied'],
  ].forEach(([a,b,st]) => iA.run(a,b,st));

  [[s[0],d[0],22,'2024-03-20','2024-07-01'],[s[1],d[0],20,'2024-03-20','2024-07-01'],
   [s[5],d[0],18,'2024-03-20','2024-07-01'],[s[9],d[0],19,'2024-03-20','2024-07-01'],
   [s[2],d[1],24,'2024-04-15','2024-07-15'],[s[6],d[1],22,'2024-04-15','2024-07-15'],
   [s[12],d[1],23,'2024-04-15','2024-07-15'],
  ].forEach(args => iP.run(...args));
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const all  = (sql, ...p) => db.prepare(sql).all(...p);
const one  = (sql, ...p) => db.prepare(sql).get(...p);
const run  = (sql, ...p) => db.prepare(sql).run(...p);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Stats / Dashboard
app.get('/api/stats', (_, res) => res.json({
  totalStudents:    one("SELECT COUNT(*) c FROM students WHERE status='active'").c,
  totalCompanies:   one('SELECT COUNT(*) c FROM companies').c,
  totalDrives:      one('SELECT COUNT(*) c FROM drives').c,
  totalPlacements:  one('SELECT COUNT(*) c FROM placements').c,
  avgPackage:       one('SELECT ROUND(AVG(package),2) avg FROM placements').avg || 0,
  placementRate:    (() => {
    const t = one("SELECT COUNT(*) c FROM students WHERE status='active'").c;
    const p = one('SELECT COUNT(*) c FROM placements').c;
    return t > 0 ? ((p/t)*100).toFixed(1) : 0;
  })(),
  deptStats:        all('SELECT * FROM placement_summary ORDER BY total_students DESC'),
  driveStatus:      all('SELECT status, COUNT(*) count FROM drives GROUP BY status'),
  recentPlacements: all(`SELECT p.package, p.offer_date, s.name student_name, s.department,
    c.name company_name, d.role FROM placements p
    JOIN students s ON p.student_id=s.id JOIN drives d ON p.drive_id=d.id
    JOIN companies c ON d.company_id=c.id ORDER BY p.created_at DESC LIMIT 6`),
}));

// Students
app.get('/api/students', (_, res) => res.json(all('SELECT * FROM students ORDER BY name')));

app.get('/api/students/:id', (req, res) => {
  const s = one('SELECT * FROM students WHERE id=?', +req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  s.applications = all(`SELECT a.*, d.title drive_title, d.role, d.package_min, d.package_max, c.name company_name
    FROM applications a JOIN drives d ON a.drive_id=d.id JOIN companies c ON d.company_id=c.id
    WHERE a.student_id=?`, +req.params.id);
  s.placement = one(`SELECT p.*, c.name company_name, d.role FROM placements p
    JOIN drives d ON p.drive_id=d.id JOIN companies c ON d.company_id=c.id WHERE p.student_id=?`, +req.params.id);
  res.json(s);
});

app.post('/api/students', (req, res) => {
  const { name, email, phone, department, cgpa, year, skills } = req.body;
  try {
    const r = run('INSERT INTO students (name,email,phone,department,cgpa,year,skills) VALUES (?,?,?,?,?,?,?)', name, email, phone, department, +cgpa||0, +year||4, skills);
    res.json({ id: r.lastInsertRowid, ...req.body, status: 'active' });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/students/:id', (req, res) => {
  const { name, email, phone, department, cgpa, year, skills, status } = req.body;
  run('UPDATE students SET name=?,email=?,phone=?,department=?,cgpa=?,year=?,skills=?,status=? WHERE id=?',
    name, email, phone, department, +cgpa, +year, skills, status||'active', +req.params.id);
  res.json({ success: true });
});

app.delete('/api/students/:id', (req, res) => { run('DELETE FROM students WHERE id=?', +req.params.id); res.json({ success: true }); });

// Companies
app.get('/api/companies', (_, res) => res.json(all(`
  SELECT c.*, COUNT(DISTINCT d.id) total_drives, COUNT(DISTINCT p.student_id) total_placed
  FROM companies c LEFT JOIN drives d ON c.id=d.company_id LEFT JOIN placements p ON d.id=p.drive_id
  GROUP BY c.id ORDER BY c.name`)));

app.post('/api/companies', (req, res) => {
  const { name, email, website, industry, description } = req.body;
  try {
    const r = run('INSERT INTO companies (name,email,website,industry,description) VALUES (?,?,?,?,?)', name, email, website, industry, description);
    res.json({ id: r.lastInsertRowid, ...req.body });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/companies/:id', (req, res) => {
  const { name, email, website, industry, description } = req.body;
  run('UPDATE companies SET name=?,email=?,website=?,industry=?,description=? WHERE id=?', name, email, website, industry, description, +req.params.id);
  res.json({ success: true });
});

app.delete('/api/companies/:id', (req, res) => { run('DELETE FROM companies WHERE id=?', +req.params.id); res.json({ success: true }); });

// Drives
app.get('/api/drives', (_, res) => res.json(all(`
  SELECT d.*, c.name company_name, c.industry, COUNT(a.id) application_count
  FROM drives d LEFT JOIN companies c ON d.company_id=c.id LEFT JOIN applications a ON d.id=a.drive_id
  GROUP BY d.id ORDER BY d.created_at DESC`)));

app.post('/api/drives', (req, res) => {
  const { company_id,title,role,package_min,package_max,location,drive_date,deadline,min_cgpa,eligible_departments,positions,status,description } = req.body;
  try {
    const r = run('INSERT INTO drives (company_id,title,role,package_min,package_max,location,drive_date,deadline,min_cgpa,eligible_departments,positions,status,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      +company_id,title,role,+package_min,+package_max,location,drive_date,deadline,+min_cgpa,eligible_departments,+positions,status||'upcoming',description);
    res.json({ id: r.lastInsertRowid, ...req.body });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/drives/:id', (req, res) => {
  const { company_id,title,role,package_min,package_max,location,drive_date,deadline,min_cgpa,eligible_departments,positions,status,description } = req.body;
  run('UPDATE drives SET company_id=?,title=?,role=?,package_min=?,package_max=?,location=?,drive_date=?,deadline=?,min_cgpa=?,eligible_departments=?,positions=?,status=?,description=? WHERE id=?',
    +company_id,title,role,+package_min,+package_max,location,drive_date,deadline,+min_cgpa,eligible_departments,+positions,status,description,+req.params.id);
  res.json({ success: true });
});

app.delete('/api/drives/:id', (req, res) => { run('DELETE FROM drives WHERE id=?', +req.params.id); res.json({ success: true }); });

// Applications
app.get('/api/applications', (_, res) => res.json(all(`
  SELECT a.*, s.name student_name, s.department, s.cgpa,
         d.title drive_title, d.role, d.package_min, d.package_max, c.name company_name
  FROM applications a JOIN students s ON a.student_id=s.id
  JOIN drives d ON a.drive_id=d.id JOIN companies c ON d.company_id=c.id
  ORDER BY a.applied_at DESC`)));

app.post('/api/applications', (req, res) => {
  try {
    const r = run('INSERT INTO applications (student_id,drive_id) VALUES (?,?)', +req.body.student_id, +req.body.drive_id);
    res.json({ id: r.lastInsertRowid, ...req.body, status: 'applied' });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/applications/:id', (req, res) => {
  run('UPDATE applications SET status=?,notes=? WHERE id=?', req.body.status, req.body.notes||'', +req.params.id);
  res.json({ success: true });
});

app.delete('/api/applications/:id', (req, res) => { run('DELETE FROM applications WHERE id=?', +req.params.id); res.json({ success: true }); });

// Placements
app.get('/api/placements', (_, res) => res.json(all(`
  SELECT p.*, s.name student_name, s.department, s.cgpa, s.email student_email,
         d.title drive_title, d.role, c.name company_name
  FROM placements p JOIN students s ON p.student_id=s.id
  JOIN drives d ON p.drive_id=d.id JOIN companies c ON d.company_id=c.id
  ORDER BY p.created_at DESC`)));

app.post('/api/placements', (req, res) => {
  const { student_id, drive_id, package: pkg, offer_date, joining_date } = req.body;
  try {
    const r = run('INSERT INTO placements (student_id,drive_id,package,offer_date,joining_date) VALUES (?,?,?,?,?)',
      +student_id, +drive_id, +pkg, offer_date, joining_date);
    run("UPDATE applications SET status='selected' WHERE student_id=? AND drive_id=?", +student_id, +drive_id);
    res.json({ id: r.lastInsertRowid, ...req.body });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/placements/:id', (req, res) => { run('DELETE FROM placements WHERE id=?', +req.params.id); res.json({ success: true }); });

// Eligible students for a drive (not yet applied, not placed, meets criteria)
app.get('/api/drives/:id/eligible', (req, res) => {
  const drive = one('SELECT * FROM drives WHERE id=?', +req.params.id);
  if (!drive) return res.status(404).json({ error: 'Not found' });
  const depts = drive.eligible_departments === 'ALL' ? null : drive.eligible_departments.split(',').map(d=>d.trim());
  let q = `SELECT s.* FROM students s WHERE s.status='active' AND s.cgpa >= ?
           AND NOT EXISTS (SELECT 1 FROM placements p WHERE p.student_id=s.id)
           AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.student_id=s.id AND a.drive_id=?)`;
  const params = [drive.min_cgpa, +req.params.id];
  if (depts) { q += ` AND s.department IN (${depts.map(()=>'?').join(',')})`; params.push(...depts); }
  res.json(all(q, ...params));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🚀  PlaceMe → http://localhost:${PORT}\n`));
