// Student Logic
const $ = id => document.getElementById(id);
const fmt = n => `₹${(+n).toFixed(1)}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysLeft = d => { const x = Math.ceil((new Date(d) - Date.now()) / 864e5); return x > 0 ? `${x}d left` : 'Closed'; };
const initials = n => n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const STATUS_BADGE = { applied: 'bb', shortlisted: 'bc', selected: 'bg', rejected: 'br' };
const sbadge = s => `<span class="badge ${STATUS_BADGE[s] || 'bk'}"><i class="fas fa-circle"></i>${s}</span>`;

function toast(msg, type = 'ts') {
    const el = document.createElement('div'); el.className = `toast ${type}`;
    const icons = { ts: 'fa-circle-check', te: 'fa-circle-exclamation', ti: 'fa-circle-info' };
    el.innerHTML = `<i class="fas ${icons[type] || 'fa-circle-info'}"></i>${msg}`;
    $('toastContainer').appendChild(el);
    setTimeout(() => { el.style.animation = 'toastOut .3s var(--tr) forwards'; setTimeout(() => el.remove(), 300); }, 3000);
}

function toggleSidebar() { $('sidebar').classList.toggle('collapsed'); }
function logout() { localStorage.removeItem('user'); window.location.href = '/'; }

const user = JSON.parse(localStorage.getItem('user') || '{}');
if (!user || user.role !== 'student') {
    window.location.href = '/'; // kick to login
}

let S = { profile: null, drives: [] };

function go(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    $(`page-${page}`).classList.add('active');
    document.querySelectorAll('.nav-item')[page === 'dashboard' ? 0 : 1].classList.add('active');
    $('pageTitle').textContent = page === 'dashboard' ? 'My Profile' : 'Available Drives';
    if (page === 'dashboard') renderProfile();
    if (page === 'drives') renderDrives();
}

async function fetchProfile() {
    try {
        const res = await fetch(`/api/student/profile/${user.student_id}`);
        S.profile = await res.json();
        renderDrives();
    } catch (e) { console.error(e); }
}

function openProfileModal() {
    $('epName').value = S.profile ? S.profile.name : '';
    $('epPhone').value = S.profile && S.profile.phone ? S.profile.phone : '';
    $('epSkills').value = S.profile && S.profile.skills ? S.profile.skills : '';
    document.getElementById('userDropdown').classList.remove('active');
    document.getElementById('editProfileModal').classList.add('active');
}

async function saveProfile() {
    if (!S.profile) return;
    try {
        const res = await fetch(`/api/student/profile/${user.student_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: $('epName').value,
                phone: $('epPhone').value,
                skills: $('epSkills').value
            })
        });
        if (!res.ok) throw new Error('Failed to update profile');
        document.getElementById('editProfileModal').classList.remove('active');
        toast('Profile updated successfully!', 'ts');
        fetchProfile();
    } catch (e) { toast(e.message, 'te'); }
}

function renderProfile() {
    if (!S.profile) return;

    // Header
    const nm = S.profile.name;
    document.querySelector('.wb-title').innerHTML = `${nm}`;
    $('headerAvatar').textContent = initials(nm);
    $('headerAvatar').style.background = `linear-gradient(135deg, #10b981, #06b6d4)`;

    // Stats
    $('s-cgpa').textContent = S.profile.cgpa;
    $('s-dept').textContent = S.profile.department;

    // If placed
    if (S.profile.placement) {
        $('placementBadge').style.display = 'flex';
        $('s-placed-info').textContent = `${S.profile.placement.company_name} - ${fmt(S.profile.placement.package)} LPA`;
    }

    // Applications
    const apps = S.profile.applications || [];
    $('appTbl').innerHTML = apps.length ? apps.map(a => `
        <tr>
            <td style="font-weight:600">${a.company_name}</td>
            <td style="color:var(--t2)">${a.role}</td>
            <td class="pkg">${fmt(a.package_min)} – ${fmt(a.package_max)} LPA</td>
            <td style="color:var(--t3)">${fmtDate(a.applied_at)}</td>
            <td>${sbadge(a.status)}</td>
        </tr>
    `).join('') : `<tr><td colspan="5"><div class="empty"><i class="fas fa-inbox"></i><p>You haven't applied to any drives yet.</p></div></td></tr>`;
}

async function fetchDrives() {
    try {
        const res = await fetch(`/api/student/drives/eligible/${user.student_id}`);
        S.drives = await res.json();
        renderDrives();
    } catch (e) { console.error(e); }
}

function renderDrives() {
    // Check if placed
    if (S.profile && S.profile.placement) {
        $('drGrid').innerHTML = `<div class="empty" style="grid-column:1/-1"><i class="fas fa-award"></i><p>Congratulations, you are placed! You cannot apply to further drives.</p></div>`;
        return;
    }

    const data = S.drives || [];
    $('drGrid').innerHTML = data.length ? data.map(d => `
    <div class="drive-card upcoming">
      <div class="dc-head">
        <div class="dc-hc1"></div><div class="dc-hc2"></div>
        <div class="dc-co">${d.company_name}</div>
      </div>
      <div class="dc-body">
        <div class="dc-title">${d.title}</div>
        <div class="dc-role">${d.role}</div>
        <div class="dc-pkg">${fmt(d.package_min)} – ${fmt(d.package_max)} <span>LPA</span></div>
        <div class="dc-chips">
          <div class="dc-chip"><i class="fas fa-location-dot"></i>${d.location || '—'}</div>
          <div class="dc-chip"><i class="fas fa-calendar-days"></i>${fmtDate(d.drive_date)}</div>
          ${d.deadline ? `<div class="dc-chip"><i class="fas fa-clock"></i>${daysLeft(d.deadline)}</div>` : ''}
        </div>
        <div class="dc-footer">
          <button class="dc-apply" style="width:100%; justify-content:center; background: var(--p); border-color: rgba(139, 92, 246, 0.4);" onclick="applyDrive(${d.id})"><i class="fas fa-paper-plane"></i> Apply Now</button>
        </div>
      </div>
    </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><i class="fas fa-briefcase"></i><p>No eligible drives available right now.</p></div>`;
}

async function applyDrive(drive_id) {
    if (!confirm('Are you sure you want to apply to this drive?')) return;
    try {
        const res = await fetch('/api/student/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: user.student_id, drive_id })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast('Application submitted successfully!');
        // Refresh data
        fetchProfile();
        fetchDrives();
        go('dashboard');
    } catch (e) {
        toast(e.message, 'te');
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    fetchProfile();
    fetchDrives();
});
