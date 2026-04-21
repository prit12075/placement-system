import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import { Plus, MapPin, Calendar, Clock, Users, Pencil, Trash2, Search } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE', 'IT', 'Chemical'];

const EMPTY = {
  company_id: '', title: '', role: '', job_type: 'full-time',
  package_min: '', package_max: '', location: '',
  drive_date: '', deadline: '', description: '',
  min_cgpa: '', min_tenth: '', min_twelfth: '',
  max_backlogs: '0', eligible_departments: 'ALL',
  positions: '1', skills_required: '', status: 'upcoming',
};

const STATUS_BADGE = {
  ongoing: 'badge-emerald', upcoming: 'badge-sky',
  completed: 'badge-muted', cancelled: 'badge-coral',
};

export default function JobPostings() {
  const api = useApi();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);
  const load = () => {
    api.get('/api/admin/jobs').then(setJobs).catch(e => toast.error(e.error));
    api.get('/api/admin/companies').then(setCompanies).catch(console.error);
  };

  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    if (!formData.company_id || !formData.title) { toast.error('Company and title are required'); return; }
    setSaving(true);
    try {
      if (formData.id) await api.put(`/api/admin/jobs/${formData.id}`, formData);
      else await api.post('/api/admin/jobs', formData);
      toast.success('Job posting saved');
      setShowModal(false);
      load();
    } catch (e) { toast.error(e.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.del(`/api/admin/jobs/${deleteId}`);
      toast.success('Job posting removed');
      setDeleteId(null);
      load();
    } catch (e) { toast.error(e.error); }
  };

  const openAdd = () => { setFormData(EMPTY); setShowModal(true); };
  const openEdit = (j) => {
    setFormData({
      id: j.id, company_id: j.company_id, title: j.title, role: j.role || '',
      job_type: j.job_type, package_min: j.package_min, package_max: j.package_max,
      location: j.location || '', drive_date: j.drive_date ? j.drive_date.split('T')[0] : '',
      deadline: j.deadline ? j.deadline.split('T')[0] : '', description: j.description || '',
      min_cgpa: j.min_cgpa, min_tenth: j.min_tenth, min_twelfth: j.min_twelfth,
      max_backlogs: j.max_backlogs, eligible_departments: j.eligible_departments,
      positions: j.positions, skills_required: j.skills_required || '', status: j.status,
    });
    setShowModal(true);
  };

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Job Postings</h1>
          <span className="page-header-count">{filtered.length} drives</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={15} /> Add Job</button>
      </div>

      <div className="filters">
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="filter-input" placeholder="Search by title or company…" style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="cards-grid">
        {filtered.map((j) => (
          <div key={j.id} className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{j.company_name}</span>
                <div className={`badge ${STATUS_BADGE[j.status] || 'badge-muted'}`} style={{ textTransform: 'capitalize' }}>{j.status}</div>
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{j.title}</h3>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>{j.role}</div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {j.location && <div className="badge badge-muted"><MapPin size={11} /> {j.location}</div>}
                {j.package_max > 0 && <div className="badge badge-emerald">₹ {parseFloat(j.package_max)} LPA</div>}
                {j.application_count > 0 && <div className="badge badge-violet"><Users size={11} /> {j.application_count} applied</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 14, fontSize: 11.5, color: 'var(--text-3)' }}>
                {j.drive_date ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {new Date(j.drive_date).toLocaleDateString()}</div> : <span />}
                {j.deadline ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> Deadline {new Date(j.deadline).toLocaleDateString()}</div> : <span />}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(j)}>
                  <Pencil size={13} /> Edit
                </button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteId(j.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <p>No job postings found</p>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={formData.id ? 'Edit Job Posting' : 'New Job Posting'} onClose={() => setShowModal(false)} onSave={handleSave} saveLabel={saving ? 'Saving…' : 'Save'}>
          <div className="form-row">
            <div className="form-group">
              <label>Company *</label>
              <select value={formData.company_id} onChange={set('company_id')}>
                <option value="">Select Company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Drive Title *</label>
              <input value={formData.title} onChange={set('title')} placeholder="Google SWE 2025" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <input value={formData.role} onChange={set('role')} placeholder="Software Engineer" />
            </div>
            <div className="form-group">
              <label>Job Type</label>
              <select value={formData.job_type} onChange={set('job_type')}>
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Min Package (LPA)</label>
              <input type="number" step="0.1" value={formData.package_min} onChange={set('package_min')} placeholder="6.0" />
            </div>
            <div className="form-group">
              <label>Max Package (LPA)</label>
              <input type="number" step="0.1" value={formData.package_max} onChange={set('package_max')} placeholder="12.0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input value={formData.location} onChange={set('location')} placeholder="Bangalore" />
            </div>
            <div className="form-group">
              <label>Positions</label>
              <input type="number" min="1" value={formData.positions} onChange={set('positions')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Drive Date</label>
              <input type="date" value={formData.drive_date} onChange={set('drive_date')} />
            </div>
            <div className="form-group">
              <label>Application Deadline</label>
              <input type="date" value={formData.deadline} onChange={set('deadline')} />
            </div>
          </div>
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label>Min CGPA</label>
              <input type="number" step="0.1" value={formData.min_cgpa} onChange={set('min_cgpa')} placeholder="6.0" />
            </div>
            <div className="form-group">
              <label>Min 10th %</label>
              <input type="number" step="0.1" value={formData.min_tenth} onChange={set('min_tenth')} placeholder="60" />
            </div>
            <div className="form-group">
              <label>Min 12th %</label>
              <input type="number" step="0.1" value={formData.min_twelfth} onChange={set('min_twelfth')} placeholder="60" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Max Backlogs</label>
              <input type="number" min="0" value={formData.max_backlogs} onChange={set('max_backlogs')} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={set('status')}>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Eligible Departments (comma-separated or ALL)</label>
            <input value={formData.eligible_departments} onChange={set('eligible_departments')} placeholder="ALL or CSE,ECE,IT" />
          </div>
          <div className="form-group">
            <label>Skills Required</label>
            <input value={formData.skills_required} onChange={set('skills_required')} placeholder="Python, SQL, Communication…" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={set('description')} />
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Remove Job Posting" onClose={() => setDeleteId(null)} onSave={handleDelete} saveLabel="Delete">
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            This will permanently remove the job posting and all associated applications. This cannot be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
