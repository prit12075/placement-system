const user = JSON.parse(localStorage.getItem('user') || '{}');
function logout() { localStorage.removeItem('user'); window.location.href = '/'; }

function openProfileModal() {
  document.getElementById('userDropdown').classList.remove('active');
  document.getElementById('editProfileModal').classList.add('active');
}

function saveProfile() {
  document.getElementById('editProfileModal').classList.remove('active');
  toast('Profile updated!', 'ts');
}

const S = { page: 'dashboard', students: [], companies: [], drives: [], applications: [], placements: [], driveFilter: '', appFilter: '', modalFn: null, applyDriveId: null };
const api = {
  get: u => fetch(u).then(r => r.json()),
  post: (u, d) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(r => r.json()),
  put: (u, d) => fetch(u, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(r => r.json()),
  del: u => fetch(u, { method: 'DELETE' }).then(r => r.json()),
};
const $ = id => document.getElementById(id);
const fmt = n => `₹${(+n).toFixed(1)}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysLeft = d => { const x = Math.ceil((new Date(d) - Date.now()) / 864e5); return x > 0 ? `${x}d left` : 'Closed'; };
const initials = n => n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#ef4444', '#a78bfa', '#14b8a6', '#f97316', '#3b82f6'];
const gc = i => COLORS[i % COLORS.length];

const STATUS_BADGE = {
  applied: 'bb', shortlisted: 'bc', selected: 'bg', rejected: 'br',
  upcoming: 'bv', ongoing: 'ba', completed: 'bk', active: 'bg', inactive: 'br'
};
const sbadge = s => `<span class="badge ${STATUS_BADGE[s] || 'bk'}"><i class="fas fa-circle"></i>${s}</span>`;

function countUp(el, to, dur = 900) {
  const from = +(el.textContent) || 0, diff = to - from, steps = dur / 16; let i = 0;
  const t = setInterval(() => { i++; el.textContent = Math.round(from + diff * (i / steps)); if (i >= steps) { el.textContent = to; clearInterval(t); } }, 16);
}
function toast(msg, type = 'ts') {
  const el = document.createElement('div'); el.className = `toast ${type}`;
  const icons = { ts: 'fa-circle-check', te: 'fa-circle-exclamation', ti: 'fa-circle-info' };
  el.innerHTML = `<i class="fas ${icons[type] || 'fa-circle-info'}"></i>${msg}`;
  $('toastContainer').appendChild(el);
  setTimeout(() => { el.style.animation = 'toastOut .3s var(--tr) forwards'; setTimeout(() => el.remove(), 300); }, 3000);
}

/* Charts */
let deptChart, driveChart;
function initCharts(st) {
  if (deptChart) deptChart.destroy();
  if (driveChart) driveChart.destroy();
  const dept = st.deptStats || [];
  Chart.defaults.color = '#475569';
  deptChart = new Chart($('deptChart'), {
    type: 'bar',
    data: {
      labels: dept.map(d => d.department),
      datasets: [
        { label: 'Total', data: dept.map(d => d.total_students), backgroundColor: 'rgba(139,92,246,0.3)', borderColor: '#8b5cf6', borderWidth: 2, borderRadius: 8, borderSkipped: false },
        { label: 'Placed', data: dept.map(d => d.placed_students), backgroundColor: 'rgba(16,185,129,0.3)', borderColor: '#10b981', borderWidth: 2, borderRadius: 8, borderSkipped: false },
      ]
    },
    options: { responsive: true, plugins: { legend: { labels: { color: '#64748b', font: { size: 11 }, boxWidth: 10 } } }, scales: { x: { ticks: { color: '#475569' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#475569' }, grid: { color: 'rgba(255,255,255,0.04)' } } } }
  });
  const ds = st.driveStatus || [];
  driveChart = new Chart($('driveChart'), {
    type: 'doughnut',
    data: {
      labels: ds.map(d => d.status),
      datasets: [{ data: ds.map(d => d.count), backgroundColor: ['rgba(139,92,246,0.85)', 'rgba(245,158,11,0.85)', 'rgba(100,116,139,0.55)'], borderWidth: 0, hoverOffset: 8 }]
    },
    options: { responsive: true, cutout: '74%', plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, boxWidth: 9, padding: 14 } } } }
  });
}

/* Navigation */
const PAGES = ['dashboard', 'students', 'companies', 'drives', 'applications', 'placements'];
const PTITLE = { dashboard: 'Dashboard', students: 'Students', companies: 'Companies', drives: 'Placement Drives', applications: 'Applications', placements: 'Placements' };
const PADD = { students: 'Add Student', companies: 'Add Company', drives: 'Add Drive', applications: 'New Application', placements: 'Record Placement' };

function go(page) {
  S.page = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-item')[PAGES.indexOf(page)].classList.add('active');
  $('pageTitle').textContent = PTITLE[page];
  $('pageSubtitle').textContent = '';
  const btn = $('addBtn');
  if (page === 'dashboard') { btn.style.display = 'none'; }
  else { btn.style.display = 'flex'; btn.innerHTML = `<i class="fas fa-plus"></i> ${PADD[page] || 'Add New'}`; }
  $('globalSearch').value = '';
  loadPage(page);
}

const skelCards = n => `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px">${Array(n).fill(`<div class="skeleton skel-card"></div>`).join('')}</div>`;
const skelRows = n => `<div style="padding:12px 18px">${Array(n).fill(`<div class="skeleton skel-row"></div>`).join('')}</div>`;

async function loadPage(page) {
  if (page === 'dashboard') { await loadDashboard(); }
  else if (page === 'students') {
    $('stuTbl').innerHTML = skelRows(6);
    S.students = await api.get('/api/students'); populateStuFilters(); renderStudents();
  } else if (page === 'companies') {
    $('coGrid').innerHTML = skelCards(4);
    S.companies = await api.get('/api/companies'); populateCoFilters(); renderCompanies();
  } else if (page === 'drives') {
    $('drGrid').innerHTML = skelCards(4);
    [S.drives, S.companies] = await Promise.all([api.get('/api/drives'), api.get('/api/companies')]); renderDrives();
  } else if (page === 'applications') {
    $('appTbl').innerHTML = skelRows(6);
    S.applications = await api.get('/api/applications'); renderApplications();
  } else if (page === 'placements') {
    $('plTbl').innerHTML = skelRows(5);
    S.placements = await api.get('/api/placements'); renderPlacements(); renderPlacementStats();
  }
}

/* Dashboard */
async function loadDashboard() {
  const st = await api.get('/api/stats');
  countUp($('s-students'), st.totalStudents);
  countUp($('s-companies'), st.totalCompanies);
  countUp($('s-drives'), st.totalDrives);
  countUp($('s-placed'), st.totalPlacements);
  $('s-drives2').textContent = st.totalDrives;
  $('s-active').textContent = `${st.totalStudents} active`;
  $('s-rate').textContent = `${st.placementRate}% placement rate`;
  $('recentTbl').innerHTML = (st.recentPlacements || []).map(p => `
    <tr>
      <td><div class="av-wrap"><div class="av" style="background:${gc(p.student_name.charCodeAt(0) % 10)}">${initials(p.student_name)}</div><div><div class="cell-name">${p.student_name}</div><div class="cell-muted">${p.department}</div></div></div></td>
      <td><span style="font-weight:600">${p.company_name}</span></td>
      <td style="color:var(--t2)">${p.role}</td>
      <td class="pkg">${fmt(p.package)} LPA</td>
      <td style="color:var(--t3)">${fmtDate(p.offer_date)}</td>
    </tr>`).join('') || `<tr><td colspan="5"><div class="empty"><i class="fas fa-inbox"></i><p>No placements yet</p></div></td></tr>`;
  setTimeout(() => initCharts(st), 60);
}

/* Students */
function populateStuFilters() {
  const depts = [...new Set(S.students.map(s => s.department))].sort();
  $('stuDept').innerHTML = '<option value="">All Departments</option>' + depts.map(d => `<option>${d}</option>`).join('');
}
function renderStudents() {
  const q = $('stuSearch').value.toLowerCase(), dept = $('stuDept').value, st = $('stuStatus').value;
  const data = S.students.filter(s => (!q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.skills || '').toLowerCase().includes(q)) && (!dept || s.department === dept) && (!st || s.status === st));
  $('stuCount').textContent = `${data.length} Students`;
  $('stuTbl').innerHTML = data.length ? data.map(s => `
    <tr>
      <td><div class="av-wrap"><div class="av" style="background:${gc(s.id % 10)}">${initials(s.name)}</div><div><div class="cell-name">${s.name}</div><div class="cell-muted">${s.email}</div></div></div></td>
      <td><span class="badge bv">${s.department}</span></td>
      <td><div class="cgpa-row"><span class="cgpa-num">${s.cgpa}</span><div class="cgpa-track"><div class="cgpa-fill" style="width:${s.cgpa * 10}%"></div></div></div></td>
      <td style="color:var(--t3);font-size:12px">${(s.skills || '').split(',').slice(0, 3).join(', ')}</td>
      <td>${sbadge(s.status)}</td>
      <td><div class="act"><button class="ib ib-v" onclick="viewStudent(${s.id})" title="View"><i class="fas fa-eye"></i></button><button class="ib ib-e" onclick="editStudent(${s.id})" title="Edit"><i class="fas fa-pen"></i></button><button class="ib ib-d" onclick="delStudent(${s.id})" title="Delete"><i class="fas fa-trash"></i></button></div></td>
    </tr>`).join('') : `<tr><td colspan="6"><div class="empty"><i class="fas fa-user-slash"></i><p>No students found</p></div></td></tr>`;
}
function openAddStudent(data = {}) {
  openModal(data.id ? 'Edit Student' : 'Add Student', `
    <div class="frow"><div class="fg"><label>Full Name *</label><input id="f-name" value="${data.name || ''}" placeholder="Arjun Sharma"></div><div class="fg"><label>Email *</label><input id="f-email" type="email" value="${data.email || ''}" placeholder="student@college.edu"></div></div>
    <div class="frow"><div class="fg"><label>Phone</label><input id="f-phone" value="${data.phone || ''}" placeholder="+91 98765 43210"></div><div class="fg"><label>Department *</label><select id="f-dept"><option value="">Select</option>${['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE', 'IT', 'Chemical'].map(d => `<option${data.department === d ? ' selected' : ''}>${d}</option>`).join('')}</select></div></div>
    <div class="frow"><div class="fg"><label>CGPA *</label><input id="f-cgpa" type="number" step="0.1" min="0" max="10" value="${data.cgpa || ''}" placeholder="8.5"></div><div class="fg"><label>Year</label><input id="f-year" type="number" min="1" max="4" value="${data.year || 4}"></div></div>
    <div class="fg"><label>Skills (comma-separated)</label><input id="f-skills" value="${data.skills || ''}" placeholder="Python, React, ML"></div>
    ${data.id ? `<div class="fg"><label>Status</label><select id="f-status"><option value="active"${data.status === 'active' ? ' selected' : ''}>Active</option><option value="inactive"${data.status === 'inactive' ? ' selected' : ''}>Inactive</option></select></div>` : '<div id="f-status" style="display:none"></div>'}
  `, async () => {
    const p = { name: $('f-name').value, email: $('f-email').value, phone: $('f-phone').value, department: $('f-dept').value, cgpa: $('f-cgpa').value, year: $('f-year').value, skills: $('f-skills').value, status: $('f-status') && $('f-status').value ? $('f-status').value : 'active' };
    if (!p.name || !p.email || !p.department || !p.cgpa) { toast('Fill all required fields', 'te'); return false; }
    const res = data.id ? await api.put(`/api/students/${data.id}`, p) : await api.post('/api/students', p);
    if (res.error) { toast(res.error, 'te'); return false; }
    toast(data.id ? 'Student updated!' : 'Student added!');
    S.students = await api.get('/api/students'); populateStuFilters(); renderStudents();
  });
}
async function editStudent(id) { openAddStudent(S.students.find(s => s.id === id)); }
async function viewStudent(id) {
  const s = await api.get(`/api/students/${id}`);
  openModal(`${s.name}`, `
    <div style="text-align:center;margin-bottom:22px">
      <div class="av" style="width:64px;height:64px;font-size:22px;background:${gc(s.id % 10)};margin:0 auto 12px;border-radius:50%">${initials(s.name)}</div>
      <div style="font-size:17px;font-weight:700">${s.name}</div>
      <div style="color:var(--t3);font-size:13px;margin-top:4px">${s.department} · ${s.email}</div>
      <div style="margin-top:10px">${sbadge(s.status)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center"><div style="font-size:26px;font-weight:800;color:var(--c)">${s.cgpa}</div><div style="font-size:10px;color:var(--t3);margin-top:3px">CGPA</div></div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center"><div style="font-size:26px;font-weight:800;color:var(--a)">${s.year}</div><div style="font-size:10px;color:var(--t3);margin-top:3px">Year</div></div>
    </div>
    ${s.skills ? `<div style="margin-bottom:16px"><div style="font-size:10px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">Skills</div><div style="display:flex;flex-wrap:wrap;gap:6px">${s.skills.split(',').map(k => `<span class="badge bv">${k.trim()}</span>`).join('')}</div></div>` : ''}
    ${s.placement ? `<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:14px;margin-bottom:14px"><div style="color:var(--g);font-weight:700;margin-bottom:4px"><i class="fas fa-trophy"></i> Placed at ${s.placement.company_name}</div><div style="font-size:13px;color:var(--t2)">${s.placement.role} · ${fmt(s.placement.package)} LPA</div></div>` : ''}
    <div style="font-size:10px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">Applications (${s.applications.length})</div>
    ${s.applications.map(a => `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;margin-bottom:6px;font-size:13px"><div><div style="font-weight:600">${a.company_name}</div><div style="color:var(--t3);font-size:11px">${a.drive_title}</div></div>${sbadge(a.status)}</div>`).join('') || '<div style="color:var(--t3);font-size:13px;text-align:center;padding:16px 0">No applications yet</div>'}
  `, null);
  $('modalSave').style.display = 'none';
}
async function delStudent(id) { if (!confirm('Delete this student?')) return; await api.del(`/api/students/${id}`); toast('Student removed', 'te'); S.students = await api.get('/api/students'); renderStudents(); }

/* Companies */
function populateCoFilters() {
  const inds = [...new Set(S.companies.map(c => c.industry).filter(Boolean))].sort();
  $('coIndustry').innerHTML = '<option value="">All Industries</option>' + inds.map(i => `<option>${i}</option>`).join('');
}
function renderCompanies() {
  const q = $('coSearch').value.toLowerCase(), ind = $('coIndustry').value;
  const data = S.companies.filter(c => (!q || c.name.toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q)) && (!ind || c.industry === ind));
  $('coGrid').innerHTML = data.length ? data.map((c, i) => `
    <div class="co-card">
      <div class="co-banner" style="background:linear-gradient(135deg,${gc(i)},${gc(i + 2)})">
        <div class="co-ava" style="background:rgba(0,0,0,.3)">${initials(c.name)}</div>
      </div>
      <div class="co-body">
        <div class="co-name">${c.name}</div>
        <div class="co-ind">${c.industry || '—'}</div>
        ${c.description ? `<p class="co-desc">${c.description.slice(0, 80)}…</p>` : ''}
        ${c.website ? `<a href="https://${c.website}" target="_blank" class="co-site"><i class="fas fa-external-link-alt"></i>${c.website}</a>` : ''}
        <div class="co-stats">
          <div class="co-stat"><div class="co-stat-n" style="color:#a78bfa">${c.total_drives}</div><div class="co-stat-l">Drives</div></div>
          <div class="co-stat"><div class="co-stat-n" style="color:var(--g)">${c.total_placed}</div><div class="co-stat-l">Placed</div></div>
        </div>
        <div class="co-acts">
          <button class="co-e" onclick="editCompany(${c.id})"><i class="fas fa-pen"></i> Edit</button>
          <button class="co-d" onclick="delCompany(${c.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><i class="fas fa-building"></i><p>No companies found</p></div>`;
}
function openAddCompany(data = {}) {
  openModal(data.id ? 'Edit Company' : 'Add Company', `
    <div class="fg"><label>Company Name *</label><input id="f-cname" value="${data.name || ''}" placeholder="Google Inc."></div>
    <div class="frow"><div class="fg"><label>Email</label><input id="f-cemail" value="${data.email || ''}" placeholder="campus@company.com"></div><div class="fg"><label>Website</label><input id="f-cweb" value="${data.website || ''}" placeholder="company.com"></div></div>
    <div class="fg"><label>Industry</label><select id="f-cind"><option value="">Select</option>${['Technology', 'IT Services', 'E-Commerce / Cloud', 'Consulting', 'Finance', 'Manufacturing', 'Healthcare', 'FMCG'].map(ind => `<option${data.industry === ind ? ' selected' : ''}>${ind}</option>`).join('')}</select></div>
    <div class="fg"><label>Description</label><textarea id="f-cdesc" placeholder="Brief description…">${data.description || ''}</textarea></div>
  `, async () => {
    const p = { name: $('f-cname').value, email: $('f-cemail').value, website: $('f-cweb').value, industry: $('f-cind').value, description: $('f-cdesc').value };
    if (!p.name) { toast('Company name required', 'te'); return false; }
    const res = data.id ? await api.put(`/api/companies/${data.id}`, p) : await api.post('/api/companies', p);
    if (res.error) { toast(res.error, 'te'); return false; }
    toast(data.id ? 'Company updated!' : 'Company added!');
    S.companies = await api.get('/api/companies'); populateCoFilters(); renderCompanies();
  });
}
function editCompany(id) { openAddCompany(S.companies.find(c => c.id === id)); }
async function delCompany(id) { if (!confirm('Delete company and all its drives?')) return; await api.del(`/api/companies/${id}`); toast('Company deleted', 'te'); S.companies = await api.get('/api/companies'); renderCompanies(); }

/* Drives */
function setDriveFilter(f, btn) { S.driveFilter = f; document.querySelectorAll('#page-drives .tab').forEach(b => b.classList.remove('on')); btn.classList.add('on'); renderDrives(); }
function renderDrives() {
  const q = $('drSearch').value.toLowerCase();
  const data = S.drives.filter(d => (!q || d.title.toLowerCase().includes(q) || d.company_name.toLowerCase().includes(q)) && (!S.driveFilter || d.status === S.driveFilter));
  $('drGrid').innerHTML = data.length ? data.map(d => `
    <div class="drive-card ${d.status}">
      <div class="dc-head">
        <div class="dc-hc1"></div><div class="dc-hc2"></div>
        <div class="dc-co">${d.company_name}</div>
        ${sbadge(d.status)}
      </div>
      <div class="dc-body">
        <div class="dc-title">${d.title}</div>
        <div class="dc-role">${d.role}</div>
        <div class="dc-pkg">${fmt(d.package_min)} – ${fmt(d.package_max)} <span>LPA</span></div>
        <div class="dc-chips">
          <div class="dc-chip"><i class="fas fa-location-dot"></i>${d.location || '—'}</div>
          <div class="dc-chip"><i class="fas fa-calendar-days"></i>${fmtDate(d.drive_date)}</div>
          <div class="dc-chip"><i class="fas fa-star"></i>Min ${d.min_cgpa} CGPA</div>
          <div class="dc-chip"><i class="fas fa-users"></i>${d.application_count} applied</div>
          ${d.deadline ? `<div class="dc-chip"><i class="fas fa-clock"></i>${daysLeft(d.deadline)}</div>` : ''}
        </div>
        <div style="font-size:11px;color:var(--t3);margin-bottom:4px"><i class="fas fa-graduation-cap" style="color:#a78bfa"></i> ${d.eligible_departments} · ${d.positions} positions</div>
        <div class="dc-footer">
          <button class="dc-apply" onclick="openApply(${d.id},'${d.title.replace(/'/g, "\\'")}')"><i class="fas fa-user-plus"></i> Apply Students</button>
          <button class="dc-edit" onclick="editDrive(${d.id})"><i class="fas fa-pen"></i></button>
          <button class="dc-del" onclick="delDrive(${d.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><i class="fas fa-briefcase"></i><p>No drives found</p></div>`;
}
function openAddDrive(data = {}) {
  openModal(data.id ? 'Edit Drive' : 'Add Drive', `
    <div class="frow"><div class="fg"><label>Company *</label><select id="f-dco"><option value="">Select</option>${S.companies.map(c => `<option value="${c.id}"${data.company_id == c.id ? ' selected' : ''}>${c.name}</option>`).join('')}</select></div><div class="fg"><label>Drive Title *</label><input id="f-dtitle" value="${data.title || ''}" placeholder="Google SWE 2024"></div></div>
    <div class="frow"><div class="fg"><label>Role</label><input id="f-drole" value="${data.role || ''}" placeholder="Software Engineer"></div><div class="fg"><label>Location</label><input id="f-dloc" value="${data.location || ''}" placeholder="Bangalore"></div></div>
    <div class="frow"><div class="fg"><label>Min Package (LPA)</label><input id="f-dpmin" type="number" value="${data.package_min || ''}"></div><div class="fg"><label>Max Package (LPA)</label><input id="f-dpmax" type="number" value="${data.package_max || ''}"></div></div>
    <div class="frow"><div class="fg"><label>Drive Date</label><input id="f-ddate" type="date" value="${data.drive_date || ''}"></div><div class="fg"><label>Deadline</label><input id="f-ddl" type="date" value="${data.deadline || ''}"></div></div>
    <div class="frow"><div class="fg"><label>Min CGPA</label><input id="f-dcgpa" type="number" step="0.1" value="${data.min_cgpa || 0}"></div><div class="fg"><label>Positions</label><input id="f-dpos" type="number" value="${data.positions || 1}"></div></div>
    <div class="frow"><div class="fg"><label>Eligible Depts</label><input id="f-ddepts" value="${data.eligible_departments || 'ALL'}" placeholder="ALL or CSE,ECE"></div><div class="fg"><label>Status</label><select id="f-dstatus"><option value="upcoming"${data.status === 'upcoming' ? ' selected' : ''}>Upcoming</option><option value="ongoing"${data.status === 'ongoing' ? ' selected' : ''}>Ongoing</option><option value="completed"${data.status === 'completed' ? ' selected' : ''}>Completed</option></select></div></div>
    <div class="fg"><label>Description</label><textarea id="f-ddesc">${data.description || ''}</textarea></div>
  `, async () => {
    const p = { company_id: $('f-dco').value, title: $('f-dtitle').value, role: $('f-drole').value, location: $('f-dloc').value, package_min: $('f-dpmin').value, package_max: $('f-dpmax').value, drive_date: $('f-ddate').value, deadline: $('f-ddl').value, min_cgpa: $('f-dcgpa').value, positions: $('f-dpos').value, eligible_departments: $('f-ddepts').value, status: $('f-dstatus').value, description: $('f-ddesc').value };
    if (!p.company_id || !p.title) { toast('Company and title required', 'te'); return false; }
    const res = data.id ? await api.put(`/api/drives/${data.id}`, p) : await api.post('/api/drives', p);
    if (res.error) { toast(res.error, 'te'); return false; }
    toast(data.id ? 'Drive updated!' : 'Drive added!');
    S.drives = await api.get('/api/drives'); renderDrives();
  });
}
function editDrive(id) { openAddDrive(S.drives.find(d => d.id === id)); }
async function delDrive(id) { if (!confirm('Delete this drive?')) return; await api.del(`/api/drives/${id}`); toast('Drive deleted', 'te'); S.drives = await api.get('/api/drives'); renderDrives(); }

/* Apply students */
async function openApply(driveId, driveTitle) {
  S.applyDriveId = driveId;
  const eligible = await api.get(`/api/drives/${driveId}/eligible`);
  $('applyTitle').textContent = `Apply: ${driveTitle}`;
  $('applyBody').innerHTML = eligible.length ? `
    <p style="font-size:12px;color:var(--t3);margin-bottom:14px">${eligible.length} eligible student(s) — select to apply</p>
    <div style="max-height:320px;overflow-y:auto">
      ${eligible.map(s => `
        <label class="apply-stu-item">
          <input type="checkbox" value="${s.id}">
          <div class="av" style="width:32px;height:32px;font-size:11px;background:${gc(s.id % 10)};border-radius:50%">${initials(s.name)}</div>
          <div style="flex:1"><div style="font-size:13px;font-weight:600">${s.name}</div><div style="font-size:11px;color:var(--t3)">${s.department} · CGPA ${s.cgpa}</div></div>
        </label>`).join('')}
    </div>`: `<div class="empty"><i class="fas fa-user-check"></i><p>No eligible students found</p></div>`;
  $('applyOverlay').classList.add('open');
}
async function submitApply() {
  const checked = [...$('applyBody').querySelectorAll('input:checked')].map(c => +c.value);
  if (!checked.length) { toast('Select at least one student', 'te'); return; }
  let ok = 0; for (const sid of checked) { const r = await api.post('/api/applications', { student_id: sid, drive_id: S.applyDriveId }); if (!r.error) ok++; }
  toast(`${ok} application(s) submitted!`); S.drives = await api.get('/api/drives'); renderDrives(); closeApply();
}
function closeApply() { $('applyOverlay').classList.remove('open'); }

/* Applications */
function setAppFilter(f, btn) { S.appFilter = f; document.querySelectorAll('#page-applications .tab').forEach(b => b.classList.remove('on')); btn.classList.add('on'); renderApplications(); }
function renderApplications() {
  const q = $('appSearch').value.toLowerCase();
  const data = S.applications.filter(a => (!q || a.student_name.toLowerCase().includes(q) || a.company_name.toLowerCase().includes(q)) && (!S.appFilter || a.status === S.appFilter));
  $('appCount').textContent = `${data.length} Applications`;
  $('appTbl').innerHTML = data.length ? data.map(a => `
    <tr>
      <td><div class="av-wrap"><div class="av" style="background:${gc(a.student_id % 10)}">${initials(a.student_name)}</div><div><div class="cell-name">${a.student_name}</div><div class="cell-muted">${a.department}</div></div></div></td>
      <td><div class="cell-name">${a.company_name}</div><div class="cell-muted">${a.drive_title}</div></td>
      <td class="pkg" style="font-size:13px">${fmt(a.package_min)}–${fmt(a.package_max)}</td>
      <td style="font-weight:700">${a.cgpa}</td>
      <td><select class="st-sel" onchange="updateAppStatus(${a.id},this.value)">${['applied', 'shortlisted', 'selected', 'rejected'].map(s => `<option value="${s}"${a.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td style="color:var(--t3);font-size:12px">${fmtDate(a.applied_at)}</td>
      <td><button class="ib ib-d" onclick="delApp(${a.id})"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('') : `<tr><td colspan="7"><div class="empty"><i class="fas fa-file-alt"></i><p>No applications</p></div></td></tr>`;
}
async function updateAppStatus(id, status) { await api.put(`/api/applications/${id}`, { status }); const a = S.applications.find(x => x.id === id); if (a) a.status = status; toast(`Status → ${status}`); }
async function delApp(id) { if (!confirm('Remove application?')) return; await api.del(`/api/applications/${id}`); toast('Removed', 'te'); S.applications = await api.get('/api/applications'); renderApplications(); }

/* Placements */
function renderPlacementStats() {
  const p = S.placements.map(x => x.package);
  countUp($('pl-total'), S.placements.length);
  $('pl-avg').textContent = p.length ? (p.reduce((a, b) => a + b, 0) / p.length).toFixed(1) : 0;
  $('pl-max').textContent = p.length ? Math.max(...p).toFixed(1) : 0;
}
function renderPlacements() {
  const q = $('plSearch').value.toLowerCase();
  const data = S.placements.filter(p => !q || p.student_name.toLowerCase().includes(q) || p.company_name.toLowerCase().includes(q));
  $('plTbl').innerHTML = data.length ? data.map(p => `
    <tr>
      <td><div class="av-wrap"><div class="av" style="background:${gc(p.student_id % 10)}">${initials(p.student_name)}</div><div><div class="cell-name">${p.student_name}</div><div class="cell-muted">${p.student_email}</div></div></div></td>
      <td><span class="badge bv">${p.department}</span></td>
      <td style="font-weight:600">${p.company_name}</td>
      <td style="color:var(--t3)">${p.role}</td>
      <td class="pkg">${fmt(p.package)} LPA</td>
      <td style="color:var(--t3);font-size:12px">${fmtDate(p.offer_date)}</td>
      <td><button class="ib ib-d" onclick="delPlacement(${p.id})"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('') : `<tr><td colspan="7"><div class="empty"><i class="fas fa-trophy"></i><p>No placements yet</p></div></td></tr>`;
}
async function openAddPlacement() {
  const [students, drives] = await Promise.all([api.get('/api/students'), api.get('/api/drives')]);
  const placed = new Set(S.placements.map(p => p.student_id));
  const unplaced = students.filter(s => !placed.has(s.id) && s.status === 'active');
  openModal('Record Placement', `
    <div class="fg"><label>Student *</label><select id="f-pstu"><option value="">Select</option>${unplaced.map(s => `<option value="${s.id}">${s.name} (${s.department}, ${s.cgpa})</option>`).join('')}</select></div>
    <div class="fg"><label>Drive *</label><select id="f-pdrv"><option value="">Select</option>${drives.filter(d => d.status !== 'upcoming').map(d => `<option value="${d.id}">${d.company_name} — ${d.title}</option>`).join('')}</select></div>
    <div class="frow"><div class="fg"><label>Package (LPA) *</label><input id="f-ppkg" type="number" step="0.1" placeholder="18.5"></div><div class="fg"><label>Offer Date</label><input id="f-pod" type="date" value="${new Date().toISOString().slice(0, 10)}"></div></div>
    <div class="fg"><label>Joining Date</label><input id="f-pjd" type="date"></div>
  `, async () => {
    const p = { student_id: $('f-pstu').value, drive_id: $('f-pdrv').value, package: $('f-ppkg').value, offer_date: $('f-pod').value, joining_date: $('f-pjd').value };
    if (!p.student_id || !p.drive_id || !p.package) { toast('Fill all required fields', 'te'); return false; }
    const res = await api.post('/api/placements', p);
    if (res.error) { toast(res.error, 'te'); return false; }
    toast('Placement recorded!'); S.placements = await api.get('/api/placements'); renderPlacements(); renderPlacementStats();
  });
}
async function delPlacement(id) { if (!confirm('Remove placement?')) return; await api.del(`/api/placements/${id}`); toast('Removed', 'te'); S.placements = await api.get('/api/placements'); renderPlacements(); renderPlacementStats(); }
function exportCSV() {
  const h = ['Name', 'Dept', 'Email', 'Company', 'Role', 'Package', 'Offer Date', 'Joining Date'];
  const r = S.placements.map(p => [p.student_name, p.department, p.student_email, p.company_name, p.role, p.package, p.offer_date, p.joining_date]);
  const csv = [h, ...r].map(row => row.join(',')).join('\n');
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = `placements_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); toast('CSV exported!');
}

/* Modal */
function openModal(title, body, onSave) {
  $('modalTitle').textContent = title; $('modalBody').innerHTML = body;
  $('modalSave').style.display = onSave ? '' : 'none'; S.modalFn = onSave;
  $('modalOverlay').classList.add('open');
}
function closeModal() { $('modalOverlay').classList.remove('open'); S.modalFn = null; }
async function submitModal() { if (S.modalFn) { const r = await S.modalFn(); if (r !== false) closeModal(); } }

/* Global add + search */
function handleAdd() {
  if (S.page === 'students') openAddStudent();
  else if (S.page === 'companies') openAddCompany();
  else if (S.page === 'drives') openAddDrive();
  else if (S.page === 'placements') openAddPlacement();
  else toast('Use "Apply Students" on a drive card', 'ti');
}
function handleGlobalSearch(q) {
  q = q.toLowerCase();
  if (S.page === 'students') { $('stuSearch').value = q; renderStudents(); }
  else if (S.page === 'companies') { $('coSearch').value = q; renderCompanies(); }
  else if (S.page === 'drives') { $('drSearch').value = q; renderDrives(); }
  else if (S.page === 'applications') { $('appSearch').value = q; renderApplications(); }
  else if (S.page === 'placements') { $('plSearch').value = q; renderPlacements(); }
}

/* Sidebar toggle */
function toggleSidebar() { $('sidebar').classList.toggle('collapsed'); }

/* Init */
document.addEventListener('DOMContentLoaded', () => { $('addBtn').style.display = 'none'; loadDashboard(); });