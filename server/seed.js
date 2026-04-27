/**
 * Seed script — run: node server/seed.js
 * Populates the database with sample admin, students, companies, jobs, applications, and placements.
 */
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return [parts[0], ''];
  const lastName = parts.pop();
  return [parts.join(' '), lastName];
}

async function seed() {
  const conn = await pool.getConnection();
  console.log('🌱 Seeding database...\n');

  try {
    // ─── Admin user ───────────────────────────────────────────
    const adminHash = await bcrypt.hash('admin123', 10);
    const [adminFirst, adminLast] = splitName('Dr. Rajesh Kumar');
    await conn.query(`INSERT IGNORE INTO users (email,password,role,first_name,last_name,phone) VALUES (?,?,?,?,?,?)`,
      ['admin@placeme.edu', adminHash, 'admin', adminFirst, adminLast, '9876500001']);
    console.log('✅ Admin: admin@placeme.edu / admin123');

    // ─── Student users + profiles ─────────────────────────────
    const students = [
      { name: 'Arjun Sharma', email: 'arjun@college.edu', phone: '9876543201', enroll: 'CS2021001', dept: 'CSE', batch: 2025, cgpa: 8.9, t10: 92.5, t12: 88.3, backlogs: 0, skills: 'Python,React,Node.js' },
      { name: 'Priya Patel', email: 'priya@college.edu', phone: '9876543202', enroll: 'CS2021002', dept: 'CSE', batch: 2025, cgpa: 9.2, t10: 95.0, t12: 91.2, backlogs: 0, skills: 'Java,Spring Boot,AWS' },
      { name: 'Rahul Singh', email: 'rahul@college.edu', phone: '9876543203', enroll: 'EC2021003', dept: 'ECE', batch: 2025, cgpa: 7.8, t10: 85.0, t12: 80.5, backlogs: 0, skills: 'C,Embedded Systems,VLSI' },
      { name: 'Sneha Iyer', email: 'sneha@college.edu', phone: '9876543204', enroll: 'CS2021004', dept: 'CSE', batch: 2025, cgpa: 8.5, t10: 90.0, t12: 86.7, backlogs: 0, skills: 'ML,Python,TensorFlow' },
      { name: 'Vikram Nair', email: 'vikram@college.edu', phone: '9876543205', enroll: 'ME2021005', dept: 'Mechanical', batch: 2025, cgpa: 7.5, t10: 82.0, t12: 78.5, backlogs: 1, skills: 'AutoCAD,SolidWorks' },
      { name: 'Ananya Roy', email: 'ananya@college.edu', phone: '9876543206', enroll: 'CS2021006', dept: 'CSE', batch: 2025, cgpa: 9.0, t10: 94.0, t12: 90.0, backlogs: 0, skills: 'JavaScript,Vue,Firebase' },
      { name: 'Karthik Reddy', email: 'karthik@college.edu', phone: '9876543207', enroll: 'EC2021007', dept: 'ECE', batch: 2025, cgpa: 8.2, t10: 87.5, t12: 83.0, backlogs: 0, skills: 'IoT,Arduino,Python' },
      { name: 'Divya Krishnan', email: 'divya@college.edu', phone: '9876543208', enroll: 'CS2021008', dept: 'CSE', batch: 2025, cgpa: 7.9, t10: 84.0, t12: 80.0, backlogs: 0, skills: 'PHP,MySQL,Laravel' },
      { name: 'Rohan Mehta', email: 'rohan@college.edu', phone: '9876543209', enroll: 'CE2021009', dept: 'Civil', batch: 2025, cgpa: 7.6, t10: 80.0, t12: 76.5, backlogs: 1, skills: 'AutoCAD,STAAD Pro' },
      { name: 'Meera Gupta', email: 'meera@college.edu', phone: '9876543210', enroll: 'CS2021010', dept: 'CSE', batch: 2025, cgpa: 9.4, t10: 96.5, t12: 93.0, backlogs: 0, skills: 'Data Science,R,Python' },
      { name: 'Aditya Kumar', email: 'aditya@college.edu', phone: '9876543211', enroll: 'EE2021011', dept: 'EEE', batch: 2025, cgpa: 8.1, t10: 86.0, t12: 82.5, backlogs: 0, skills: 'Power Systems,MATLAB' },
      { name: 'Pooja Desai', email: 'pooja@college.edu', phone: '9876543212', enroll: 'CS2021012', dept: 'CSE', batch: 2025, cgpa: 8.7, t10: 91.0, t12: 87.5, backlogs: 0, skills: 'Android,Kotlin,Flutter' },
      { name: 'Siddharth Joshi', email: 'siddharth@college.edu', phone: '9876543213', enroll: 'CS2021013', dept: 'CSE', batch: 2025, cgpa: 7.7, t10: 83.0, t12: 79.0, backlogs: 0, skills: 'DevOps,Docker,K8s' },
      { name: 'Kavya Bhat', email: 'kavya@college.edu', phone: '9876543214', enroll: 'EC2021014', dept: 'ECE', batch: 2025, cgpa: 8.4, t10: 89.0, t12: 85.0, backlogs: 0, skills: 'Signal Processing,MATLAB' },
      { name: 'Nikhil Verma', email: 'nikhil@college.edu', phone: '9876543215', enroll: 'CS2021015', dept: 'CSE', batch: 2025, cgpa: 9.1, t10: 93.5, t12: 90.5, backlogs: 0, skills: 'Blockchain,Solidity,Web3' },
    ];

    const stuHash = await bcrypt.hash('student123', 10);
    const stuIds = [];

    for (const s of students) {
      const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [s.email]);
      if (existing.length) { stuIds.push(null); continue; }

      const [firstName, lastName] = splitName(s.name);
      const [uRes] = await conn.query('INSERT INTO users (email,password,role,first_name,last_name,phone) VALUES(?,?,?,?,?,?)',
        [s.email, stuHash, 'student', firstName, lastName, s.phone]);
      const [sRes] = await conn.query(
        'INSERT INTO students (user_id,enrollment_no,department,batch_year,cgpa,tenth_pct,twelfth_pct,backlogs,skills) VALUES(?,?,?,?,?,?,?,?,?)',
        [uRes.insertId, s.enroll, s.dept, s.batch, s.cgpa, s.t10, s.t12, s.backlogs, s.skills]);
      stuIds.push(sRes.insertId);
    }
    console.log(`✅ ${stuIds.filter(Boolean).length} students created (password: student123)`);

    // ─── Companies ────────────────────────────────────────────
    const companies = [
      ['Google', 'campus@google.com', 'google.com', 'Technology', "World's leading technology company", 'Bangalore'],
      ['Microsoft', 'campus@microsoft.com', 'microsoft.com', 'Technology', 'Enterprise software & cloud giant', 'Hyderabad'],
      ['Amazon', 'campus@amazon.com', 'amazon.com', 'E-Commerce / Cloud', 'AWS & global e-commerce leader', 'Bangalore'],
      ['TCS', 'campus@tcs.com', 'tcs.com', 'IT Services', "India's largest IT services company", 'Multiple'],
      ['Infosys', 'campus@infosys.com', 'infosys.com', 'IT Services', 'Global digital services company', 'Pune'],
      ['Accenture', 'campus@accenture.com', 'accenture.com', 'Consulting', 'Global professional services company', 'Mumbai'],
    ];

    const coIds = [];
    for (const c of companies) {
      const [existing] = await conn.query('SELECT id FROM companies WHERE name = ?', [c[0]]);
      if (existing.length) { coIds.push(existing[0].id); continue; }
      const [r] = await conn.query('INSERT INTO companies (name,email,website,industry,description,location) VALUES(?,?,?,?,?,?)', c);
      coIds.push(r.insertId);
    }
    console.log(`✅ ${companies.length} companies`);

    // ─── Get admin ID ─────────────────────────────────────────
    const [[admin]] = await conn.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

    // ─── Job postings ─────────────────────────────────────────
    const dayOff = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
    const jobs = [
      [coIds[0], 'Google SWE Campus 2025', 'Full-time SWE role at Google Bangalore', 'Software Engineer', 'full-time', 18, 25, 'Bangalore', '2024-03-15', '2024-02-28', 8.0, 80, 75, 0, 'CSE', 5, 'DSA,System Design,Python', 'completed', admin.id],
      [coIds[1], 'Microsoft SDE Drive', 'SDE-1 role at Microsoft Hyderabad', 'Software Developer', 'full-time', 20, 30, 'Hyderabad', '2024-04-10', '2024-03-25', 7.5, 75, 70, 0, 'CSE,ECE', 8, 'Java,C++,SQL', 'completed', admin.id],
      [coIds[2], 'Amazon SDE-1 Hiring', 'SDE-1 at Amazon Bangalore', 'Software Developer', 'full-time', 22, 28, 'Bangalore', dayOff(30), dayOff(15), 8.0, 80, 75, 0, 'CSE', 6, 'DSA,AWS,Java', 'ongoing', admin.id],
      [coIds[3], 'TCS Ninja 2025', 'Mass recruitment for all branches', 'Systems Engineer', 'full-time', 3.5, 4.5, 'Multiple', dayOff(20), dayOff(8), 6.5, 60, 55, 2, 'ALL', 30, 'Communication,Aptitude', 'upcoming', admin.id],
      [coIds[4], 'Infosys Power Programmer', 'Elite programmer track at Infosys', 'Software Engineer', 'full-time', 6, 8, 'Pune', dayOff(25), dayOff(12), 7.0, 70, 65, 0, 'CSE,ECE,EEE', 15, 'Java,Python,Problem Solving', 'upcoming', admin.id],
      [coIds[5], 'Accenture ASE Batch', 'Associate Software Engineer batch hiring', 'Associate Engineer', 'full-time', 4.5, 6.5, 'Mumbai', dayOff(35), dayOff(20), 7.0, 65, 60, 1, 'ALL', 20, 'SQL,Java,Communication', 'upcoming', admin.id],
    ];

    const jobIds = [];
    for (const j of jobs) {
      const [existing] = await conn.query('SELECT id FROM job_postings WHERE title = ? AND company_id = ?', [j[1], j[0]]);
      if (existing.length) { jobIds.push(existing[0].id); continue; }
      const [r] = await conn.query(
        `INSERT INTO job_postings (company_id,title,description,role,job_type,package_min,package_max,location,drive_date,deadline,min_cgpa,min_tenth,min_twelfth,max_backlogs,eligible_departments,positions,skills_required,status,created_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, j);
      jobIds.push(r.insertId);
    }
    console.log(`✅ ${jobs.length} job postings`);

    // ─── Applications ─────────────────────────────────────────
    // Filter out null stuIds (already existed)
    const validStu = stuIds.filter(Boolean);
    if (validStu.length >= 15) {
      const apps = [
        [validStu[0], jobIds[0], 'selected'], [validStu[1], jobIds[0], 'selected'],
        [validStu[3], jobIds[0], 'rejected'], [validStu[5], jobIds[0], 'selected'],
        [validStu[9], jobIds[0], 'selected'],
        [validStu[2], jobIds[1], 'selected'], [validStu[6], jobIds[1], 'selected'],
        [validStu[12], jobIds[1], 'selected'], [validStu[1], jobIds[1], 'rejected'],
        [validStu[3], jobIds[2], 'applied'], [validStu[7], jobIds[2], 'applied'],
        [validStu[11], jobIds[2], 'applied'], [validStu[14], jobIds[2], 'shortlisted'],
        [validStu[4], jobIds[3], 'applied'], [validStu[8], jobIds[3], 'applied'],
        [validStu[10], jobIds[4], 'applied'], [validStu[13], jobIds[4], 'applied'],
      ];

      for (const [sid, jid, st] of apps) {
        await conn.query('INSERT IGNORE INTO applications (student_id,job_id,status) VALUES(?,?,?)', [sid, jid, st]);
      }
      console.log(`✅ ${apps.length} applications`);

      // ─── Placements ───────────────────────────────────────────
      const placements = [
        [validStu[0], jobIds[0], 22, '2024-03-20', '2024-07-01'],
        [validStu[1], jobIds[0], 20, '2024-03-20', '2024-07-01'],
        [validStu[5], jobIds[0], 18, '2024-03-20', '2024-07-01'],
        [validStu[9], jobIds[0], 19, '2024-03-20', '2024-07-01'],
        [validStu[2], jobIds[1], 24, '2024-04-15', '2024-07-15'],
        [validStu[6], jobIds[1], 22, '2024-04-15', '2024-07-15'],
        [validStu[12], jobIds[1], 23, '2024-04-15', '2024-07-15'],
      ];

      for (const [sid, jid, pkg, odate, jdate] of placements) {
        // Get application_id
        const [[app]] = await conn.query('SELECT id FROM applications WHERE student_id = ? AND job_id = ?', [sid, jid]);
        await conn.query(
          'INSERT IGNORE INTO placements (student_id,job_id,application_id,package,offer_date,joining_date) VALUES(?,?,?,?,?,?)',
          [sid, jid, app ? app.id : null, pkg, odate, jdate]);
      }
      console.log(`✅ ${placements.length} placements`);
    }

    console.log('\n🎉 Seed complete!\n');
    console.log('   Admin login:   admin@placeme.edu / admin123');
    console.log('   Student login:  arjun@college.edu / student123');
    console.log('                  (all students share password: student123)\n');
  } catch (e) {
    console.error('❌ Seed error:', e.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
