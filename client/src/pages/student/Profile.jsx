import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function Profile() {
  const api = useApi();
  const toast = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { load() }, []);
  const load = () => api.get('/api/student/profile').then(data => { setProfile(data); setFormData(data); }).catch(console.error);

  const handleSave = async () => {
    try {
      await api.put('/api/student/profile', formData);
      toast.success('Profile updated');
      setIsEditing(false);
      load();
    } catch (e) { toast.error(e.error); }
  };

  if (!profile) return <div className="empty-state">Loading profile...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>My Profile</h1>
          <p style={{ color: 'var(--text-2)' }}>Manage your personal and academic information.</p>
        </div>
        {!isEditing ? (
          <button className="btn btn-ghost" onClick={() => setIsEditing(true)}>Edit Profile</button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => { setFormData(profile); setIsEditing(false); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--accent)' }}>System Information (Read-only)</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Enrollment Number</label>
            <input value={profile.enrollment_no} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label>Department & Batch</label>
            <input value={`${profile.department} (${profile.batch_year})`} disabled style={{ opacity: 0.6 }} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Current CGPA</label>
            <input value={profile.cgpa} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label>Active Backlogs</label>
            <input value={profile.backlogs} disabled style={{ opacity: 0.6 }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--accent)' }}>Editable Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input value={formData.first_name || ''} onChange={e => setFormData({...formData, first_name: e.target.value})} disabled={!isEditing} />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input value={formData.last_name || ''} onChange={e => setFormData({...formData, last_name: e.target.value})} disabled={!isEditing} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone Number</label>
            <input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!isEditing} />
          </div>
        </div>
        <div className="form-group">
          <label>Skills (comma separated)</label>
          <textarea value={formData.skills || ''} onChange={e => setFormData({...formData, skills: e.target.value})} disabled={!isEditing} placeholder="Python, React, Machine Learning..." style={{ minHeight: 100 }}></textarea>
        </div>
        <div className="form-group">
          <label>Resume Link (Google Drive / public URL)</label>
          <input value={formData.resume_url || ''} onChange={e => setFormData({...formData, resume_url: e.target.value})} disabled={!isEditing} placeholder="https://..." />
        </div>
      </div>
    </div>
  );
}
