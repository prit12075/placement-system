import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import { Plus, Building2, MapPin, Pencil, Trash2 } from 'lucide-react';

const EMPTY = { name: '', email: '', website: '', industry: '', location: '', description: '' };

export default function Companies() {
  const api = useApi();
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  const load = () => api.get('/api/admin/companies').then(setCompanies).catch(e => toast.error(e.error));

  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    if (!formData.name) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      if (formData.id) await api.put(`/api/admin/companies/${formData.id}`, formData);
      else await api.post('/api/admin/companies', formData);
      toast.success('Company saved');
      setShowModal(false);
      load();
    } catch (e) { toast.error(e.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.del(`/api/admin/companies/${deleteId}`);
      toast.success('Company removed');
      setDeleteId(null);
      load();
    } catch (e) { toast.error(e.error); }
  };

  const openAdd = () => { setFormData(EMPTY); setShowModal(true); };
  const openEdit = (c) => {
    setFormData({ id: c.id, name: c.name, email: c.email || '', website: c.website || '', industry: c.industry || '', location: c.location || '', description: c.description || '' });
    setShowModal(true);
  };

  // Deterministic color from company name
  const hue = (name) => name.charCodeAt(0) * 17 % 360;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Partner Companies</h1>
          <span className="page-header-count">{companies.length} companies</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={15} /> Add Company</button>
      </div>

      <div className="cards-grid">
        {companies.map((c) => (
          <div key={c.id} className="card">
            <div className="card-banner" style={{ background: `linear-gradient(135deg, hsl(${hue(c.name)},55%,30%), hsl(${hue(c.name)+25},55%,20%))` }}>
              <h3 style={{ color: '#fff', fontSize: 18, zIndex: 1, lineHeight: 1.3 }}>{c.name}</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: 13, marginBottom: 6 }}>
                <Building2 size={13} /> {c.industry || '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12, marginBottom: 14 }}>
                <MapPin size={13} /> {c.location || '—'}
              </div>
              {c.description && (
                <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Drives</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700 }}>{c.total_jobs}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Placed</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: 'var(--emerald)' }}>{c.total_placed}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(c)}>
                  <Pencil size={13} /> Edit
                </button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteId(c.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {companies.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <Building2 size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p>No companies added yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={formData.id ? 'Edit Company' : 'Add Company'} onClose={() => setShowModal(false)} onSave={handleSave} saveLabel={saving ? 'Saving…' : 'Save'}>
          <div className="form-group">
            <label>Company Name *</label>
            <input value={formData.name} onChange={set('name')} placeholder="Google Inc." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input value={formData.email} onChange={set('email')} placeholder="campus@company.com" />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input value={formData.website} onChange={set('website')} placeholder="company.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Industry</label>
              <input value={formData.industry} onChange={set('industry')} placeholder="Technology" />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input value={formData.location} onChange={set('location')} placeholder="Bangalore" />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={set('description')} />
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Remove Company" onClose={() => setDeleteId(null)} onSave={handleDelete} saveLabel="Delete">
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            Removing this company will also delete all its job postings and related applications. This cannot be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
