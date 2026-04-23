const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', '..', 'placement.db'));

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

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
    department_id INTEGER REFERENCES departments(id),
    phone       TEXT,
    cgpa        REAL DEFAULT 0,
    year        INTEGER DEFAULT 4,
    status      TEXT DEFAULT 'active',
    created_at  TEXT DEFAULT (datetime('now'))
  );
  
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL,
    student_id  INTEGER REFERENCES students(id) ON DELETE CASCADE,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS student_skills (
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, skill_id)
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
    positions            INTEGER DEFAULT 1,
    status               TEXT DEFAULT 'upcoming',
    description          TEXT,
    created_at           TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS drive_departments (
    drive_id INTEGER REFERENCES drives(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    PRIMARY KEY (drive_id, department_id)
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
    SELECT d.name AS department,
           COUNT(DISTINCT s.id)         AS total_students,
           COUNT(DISTINCT p.student_id) AS placed_students,
           ROUND(AVG(p.package), 2)     AS avg_package,
           MAX(p.package)               AS max_package
    FROM   students s
    JOIN departments d ON s.department_id = d.id
    LEFT JOIN placements p ON s.id = p.student_id
    GROUP  BY d.name;
`);

const initAuth = () => {
  db.prepare("INSERT OR IGNORE INTO users (email, password, role) VALUES ('admin@college.edu', 'admin', 'admin')").run();
};
initAuth();

if (!db.prepare('SELECT 1 FROM companies LIMIT 1').get()) {
  const getOrInsertDept = (name) => {
    let r = db.prepare('SELECT id FROM departments WHERE name=?').get(name);
    if (!r) { r = { id: db.prepare('INSERT INTO departments (name) VALUES (?)').run(name).lastInsertRowid }; }
    return r.id;
  };

  const getOrInsertSkill = (name) => {
    let r = db.prepare('SELECT id FROM skills WHERE name=?').get(name);
    if (!r) { r = { id: db.prepare('INSERT INTO skills (name) VALUES (?)').run(name).lastInsertRowid }; }
    return r.id;
  };

  const iC = db.prepare('INSERT INTO companies (name,email,website,industry,description) VALUES (?,?,?,?,?)');
  const iS = db.prepare('INSERT INTO students (name,department_id,phone,cgpa,year) VALUES (?,?,?,?,?)');
  const iSS = db.prepare('INSERT INTO student_skills (student_id, skill_id) VALUES (?,?)');
  const iU = db.prepare('INSERT INTO users (email, password, role, student_id) VALUES (?,?,?,?)');
  const iD = db.prepare('INSERT INTO drives (company_id,title,role,package_min,package_max,location,drive_date,deadline,min_cgpa,positions,status,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  const iDD = db.prepare('INSERT INTO drive_departments (drive_id, department_id) VALUES (?,?)');
  const iA = db.prepare('INSERT OR IGNORE INTO applications (student_id,drive_id,status) VALUES (?,?,?)');
  const iP = db.prepare('INSERT OR IGNORE INTO placements (student_id,drive_id,package,offer_date,joining_date) VALUES (?,?,?,?,?)');

  const dayOffset = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

  const c = [
    iC.run('Google', 'campus@google.com', 'google.com', 'Technology', "World's leading technology company").lastInsertRowid,
    iC.run('Microsoft', 'campus@microsoft.com', 'microsoft.com', 'Technology', 'Enterprise software & cloud giant').lastInsertRowid,
    iC.run('Amazon', 'campus@amazon.com', 'amazon.com', 'E-Commerce / Cloud', 'AWS & global e-commerce leader').lastInsertRowid,
    iC.run('TCS', 'campus@tcs.com', 'tcs.com', 'IT Services', "India's largest IT services company").lastInsertRowid,
    iC.run('Infosys', 'campus@infosys.com', 'infosys.com', 'IT Services', 'Global digital services company').lastInsertRowid,
    iC.run('Accenture', 'campus@accenture.com', 'accenture.com', 'Consulting', 'Global professional services company').lastInsertRowid,
  ];

  const studentData = [
    ['Arjun Sharma', 'arjun@college.edu', '9876543201', 'CSE', 8.9, 4, 'Python,React,Node.js'],
    ['Priya Patel', 'priya@college.edu', '9876543202', 'CSE', 9.2, 4, 'Java,Spring,AWS'],
    ['Rahul Singh', 'rahul@college.edu', '9876543203', 'ECE', 7.8, 4, 'C,Embedded,VLSI'],
    ['Sneha Iyer', 'sneha@college.edu', '9876543204', 'CSE', 8.5, 4, 'ML,Python,TensorFlow'],
    ['Vikram Nair', 'vikram@college.edu', '9876543205', 'Mechanical', 7.5, 4, 'AutoCAD,SolidWorks'],
    ['Ananya Roy', 'ananya@college.edu', '9876543206', 'CSE', 9.0, 4, 'JavaScript,Vue,Firebase'],
    ['Karthik Reddy', 'karthik@college.edu', '9876543207', 'ECE', 8.2, 4, 'IoT,Arduino,Python'],
    ['Divya Krishnan', 'divya@college.edu', '9876543208', 'CSE', 7.9, 4, 'PHP,MySQL,Laravel'],
    ['Rohan Mehta', 'rohan@college.edu', '9876543209', 'Civil', 7.6, 4, 'AutoCAD,STAAD Pro'],
    ['Meera Gupta', 'meera@college.edu', '9876543210', 'CSE', 9.4, 4, 'Data Science,R,Python'],
    ['Aditya Kumar', 'aditya@college.edu', '9876543211', 'EEE', 8.1, 4, 'Power Systems,MATLAB'],
    ['Pooja Desai', 'pooja@college.edu', '9876543212', 'CSE', 8.7, 4, 'Android,Kotlin,Flutter'],
    ['Siddharth Joshi', 'siddharth@college.edu', '9876543213', 'CSE', 7.7, 4, 'DevOps,Docker,K8s'],
    ['Kavya Bhat', 'kavya@college.edu', '9876543214', 'ECE', 8.4, 4, 'Signal Processing,MATLAB'],
    ['Nikhil Verma', 'nikhil@college.edu', '9876543215', 'CSE', 9.1, 4, 'Blockchain,Solidity,Web3'],
  ];

  const sIds = [];
  studentData.forEach(r => {
    let deptId = getOrInsertDept(r[3]);
    let sid = iS.run(r[0], deptId, r[2], r[4], r[5]).lastInsertRowid;
    iU.run(r[1], 'student123', 'student', sid);
    r[6].split(',').forEach(sk => {
      if (sk.trim() !== '') {
        let skid = getOrInsertSkill(sk.trim());
        iSS.run(sid, skid);
      }
    });
    sIds.push(sid);
  });

  const d1 = iD.run(c[0], 'Google SWE Campus', 'Software Engineer', 18, 25, 'Bangalore', '2024-03-15', '2024-02-28', 8.0, 5, 'completed', 'Full-time SWE role at Google Bangalore').lastInsertRowid;
  iDD.run(d1, getOrInsertDept('CSE'));

  const d2 = iD.run(c[1], 'Microsoft SDE Drive', 'Software Developer', 20, 30, 'Hyderabad', '2024-04-10', '2024-03-25', 7.5, 8, 'completed', 'SDE-1 role at Microsoft Hyderabad').lastInsertRowid;
  iDD.run(d2, getOrInsertDept('CSE'));
  iDD.run(d2, getOrInsertDept('ECE'));

  const d3 = iD.run(c[2], 'Amazon SDE-1 Hiring', 'Software Developer', 22, 28, 'Bangalore', dayOffset(30), dayOffset(15), 8.0, 6, 'ongoing', 'SDE-1 at Amazon Bangalore').lastInsertRowid;
  iDD.run(d3, getOrInsertDept('CSE'));

  const d4 = iD.run(c[3], 'TCS Ninja 2024', 'Systems Engineer', 3.5, 4.5, 'Multiple', dayOffset(20), dayOffset(8), 6.5, 30, 'upcoming', 'Mass recruitment for all branches').lastInsertRowid;
  // 'ALL' was previously used. To mimic it gracefully here, let's insert ALL existing departments:
  db.prepare('SELECT id FROM departments').all().forEach(dep => iDD.run(d4, dep.id));

  const d5 = iD.run(c[4], 'Infosys Power Programmer', 'Software Engineer', 6, 8, 'Pune', dayOffset(25), dayOffset(12), 7.0, 15, 'upcoming', 'Elite programmer track at Infosys').lastInsertRowid;
  iDD.run(d5, getOrInsertDept('CSE')); iDD.run(d5, getOrInsertDept('ECE')); iDD.run(d5, getOrInsertDept('EEE'));

  const d6 = iD.run(c[5], 'Accenture ASE Batch', 'Associate Eng.', 4.5, 6.5, 'Mumbai', dayOffset(35), dayOffset(20), 7.0, 20, 'upcoming', 'Associate Software Engineer batch').lastInsertRowid;
  db.prepare('SELECT id FROM departments').all().forEach(dep => iDD.run(d6, dep.id));

  [[sIds[0], d1, 'selected'], [sIds[1], d1, 'selected'], [sIds[3], d1, 'rejected'], [sIds[5], d1, 'selected'], [sIds[9], d1, 'selected'],
  [sIds[2], d2, 'selected'], [sIds[6], d2, 'selected'], [sIds[12], d2, 'selected'], [sIds[1], d2, 'rejected'],
  [sIds[3], d3, 'applied'], [sIds[7], d3, 'applied'], [sIds[11], d3, 'applied'], [sIds[14], d3, 'shortlisted'],
  [sIds[4], d4, 'applied'], [sIds[8], d4, 'applied'], [sIds[10], d5, 'applied'], [sIds[13], d5, 'applied'],
  ].forEach(([a, b, st]) => iA.run(a, b, st));

  [[sIds[0], d1, 22, '2024-03-20', '2024-07-01'], [sIds[1], d1, 20, '2024-03-20', '2024-07-01'],
  [sIds[5], d1, 18, '2024-03-20', '2024-07-01'], [sIds[9], d1, 19, '2024-03-20', '2024-07-01'],
  [sIds[2], d2, 24, '2024-04-15', '2024-07-15'], [sIds[6], d2, 22, '2024-04-15', '2024-07-15'],
  [sIds[12], d2, 23, '2024-04-15', '2024-07-15'],
  ].forEach(args => iP.run(...args));
}

const all = (sql, ...p) => db.prepare(sql).all(...p);
const one = (sql, ...p) => db.prepare(sql).get(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);

module.exports = { db, all, one, run };
