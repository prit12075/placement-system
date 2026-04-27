import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import { Search, Plus, Pencil, Trash2, CheckCircle, Clock } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE', 'IT', 'Chemical'];

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '', password: '',
  enrollment_no: '', department: '', batch_year: '',
  cgpa: '', tenth_pct: '', twelfth_pct: '', backlogs: '', skills: '',
  is_active: true,
};

export default function Students() {
  const api = useApi();
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);
  const load = () => api.get('/api/admin/students').then(setStudents).catch(e => toast.error(e.error));

  const filtered = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchSearch = fullName.includes(search.toLowerCase()) ||
      s.enrollment_no.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || s.department === filterDept;
    const matchStatus = !filterStatus || s.placement_status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const depts = [...new Set(students.map(s => s.department))].sort();

  const openAdd = () => { setFormData(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s) => {
    setFormData({
      id: s.id,
      first_name: s.first_name, last_name: s.last_name, email: s.email, phone: s.phone || '',
      password: '',
      enrollment_no: s.enrollment_no, department: s.department,
      batch_year: s.batch_year, cgpa: s.cgpa, tenth_pct: s.tenth_pct,
      twelfth_pct: s.twelfth_pct, backlogs: s.backlogs,
      skills: s.skills || '', is_active: s.is_active,
    });
    setShowModal(true);
  };

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(p => ({ ...p, [field]: val }));
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.department) {
      toast.error('First name, last name, email and department are required');
      return;
    }
    if (!formData.id && !formData.password) {
      toast.error('Password is required for new students');
      return;
    }
    setSaving(true);
    try {
      if (formData.id) {
        await api.put(`/api/admin/students/${formData.id}`, formData);
        toast.success('Student updated');
      } else {
        await api.post('/api/admin/students', formData);
        toast.success('Student added');
      }
      setShowModal(false);
      load();
    } catch (e) { toast.error(e.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.del(`/api/admin/students/${deleteId}`);
      toast.success('Student removed');
      setDeleteId(null);
      load();
    } catch (e) { toast.error(e.error); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Manage Students</h1>
          <span className="page-header-count">{filtered.length} of {students.length}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={15} /> Add Student</button>
      </div>

      <div className="filters">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="filter-input" placeholder="Search name, enrollment or email…" style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="unplaced">Unplaced</option>
          <option value="placed">Placed</option>
        </select>
      </div>

      <div className="data-table-wrap">
        <table>
          <thead>
            <tr><th>Student</th><th>Enrollment</th><th>Dept / Batch</th><th>CGPA</th><th>Status</th><th>Account</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div className="cell-avatar">
                    <div className="avatar" style={{ background: `hsl(${s.first_name.charCodeAt(0) * 9 % 360},50%,25%)` }}>{s.first_name[0]}</div>
                    <div><div className="cell-name">{s.first_name} {s.last_name}</div><div className="cell-sub">{s.email}</div></div>
                  </div>
                </td>
                <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 12 }}>{s.enrollment_no}</td>
                <td>
                  <div className="badge badge-muted">{s.department}</div>
                  <div className="cell-sub" style={{ marginTop: 4 }}>{s.batch_year}</div>
                </td>
                <td>
                  <div className="cgpa-bar">
                    <span className="cgpa-num">{s.cgpa}</span>
                    <div className="cgpa-track"><div className="cgpa-fill" style={{ width: `${s.cgpa * 10}%` }}></div></div>
                  </div>
                </td>
                <td>
                  {s.placement_status === 'placed'
                    ? <div className="badge badge-emerald"><CheckCircle size={11} /> Placed</div>
                    : <div className="badge badge-amber"><Clock size={11} /> Unplaced</div>}
                </td>
                <td>{s.is_active ? <div className="badge badge-sky">Active</div> : <div className="badge badge-coral">Disabled</div>}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-icon" title="Delete" onClick={() => setDeleteId(s.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No students found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={formData.id ? 'Edit Student' : 'Add Student'}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saveLabel={saving ? 'Saving…' : 'Save'}
        >
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input value={formData.first_name} onChange={set('first_name')} placeholder="Arjun" />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={formData.last_name} onChange={set('last_name')} placeholder="Sharma" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={formData.email} onChange={set('email')} placeholder="student@college.edu" disabled={!!formData.id} style={formData.id ? { opacity: 0.5 } : {}} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input value={formData.phone} onChange={set('phone')} placeholder="9876543210" />
            </div>
            <div className="form-group">
              <label>{formData.id ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" value={formData.password} onChange={set('password')} placeholder="••••••••" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Enrollment No *</label>
              <input value={formData.enrollment_no} onChange={set('enrollment_no')} placeholder="CS2021001" disabled={!!formData.id} style={formData.id ? { opacity: 0.5 } : {}} />
            </div>
            <div className="form-group">
              <label>Batch Year</label>
              <input type="number" value={formData.batch_year} onChange={set('batch_year')} placeholder="2025" />
            </div>
          </div>
          <div className="form-group">
            <label>Department *</label>
            <select value={formData.department} onChange={set('department')}>
              <option value="">Select</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <div className="form-group">
              <label>CGPA</label>
              <input type="number" step="0.01" value={formData.cgpa} onChange={set('cgpa')} placeholder="8.50" />
            </div>
            <div className="form-group">
              <label>10th %</label>
              <input type="number" step="0.01" value={formData.tenth_pct} onChange={set('tenth_pct')} />
            </div>
            <div className="form-group">
              <label>12th %</label>
              <input type="number" step="0.01" value={formData.twelfth_pct} onChange={set('twelfth_pct')} />
            </div>
            <div className="form-group">
              <label>Backlogs</label>
              <input type="number" value={formData.backlogs} onChange={set('backlogs')} placeholder="0" />
            </div>
          </div>
          <div className="form-group">
            <label>Skills (comma-separated)</label>
            <input value={formData.skills} onChange={set('skills')} placeholder="Python, React, MySQL…" />
          </div>
          {formData.id && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={set('is_active')} style={{ width: 'auto' }} />
              <label htmlFor="is_active" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13, cursor: 'pointer' }}>Account active</label>
            </div>
          )}
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal title="Remove Student" onClose={() => setDeleteId(null)} onSave={handleDelete} saveLabel="Delete" showSave>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            This will permanently delete the student and all their applications. This action cannot be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
