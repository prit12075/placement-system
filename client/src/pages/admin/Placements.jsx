import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import { Trophy, Trash2 } from 'lucide-react';

export default function Placements() {
  const api = useApi();
  const toast = useToast();
  const [placements, setPlacements] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);
  const load = () => api.get('/api/admin/placements').then(setPlacements).catch(e => toast.error(e.error));

  const handleRevoke = async () => {
    try {
      await api.del(`/api/admin/placements/${deleteId}`);
      toast.success('Placement revoked');
      setDeleteId(null);
      load();
    } catch (e) { toast.error(e.error); }
  };

  const maxPackage = placements.length ? Math.max(...placements.map(p => parseFloat(p.package))) : 0;
  const avgPackage = placements.length
    ? (placements.reduce((a, b) => a + parseFloat(b.package), 0) / placements.length).toFixed(2)
    : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Confirmed Placements</h1>
          <span className="page-header-count">{placements.length} placed</span>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-icon amber"><Trophy size={20} /></div>
          <div className="stat-card-value" style={{ color: 'var(--accent)' }}>{placements.length}</div>
          <div className="stat-card-label">Total Placed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--emerald)', fontSize: 28 }}>₹ {avgPackage}<span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 400 }}> LPA</span></div>
          <div className="stat-card-label">Average Package</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--violet)', fontSize: 28 }}>₹ {maxPackage}<span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 400 }}> LPA</span></div>
          <div className="stat-card-label">Highest Package</div>
        </div>
      </div>

      <div className="data-table-wrap">
        <table>
          <thead>
            <tr><th>Student</th><th>Dept</th><th>Company / Role</th><th>Package</th><th>Offer Date</th><th></th></tr>
          </thead>
          <tbody>
            {placements.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="cell-avatar">
                    <div className="avatar" style={{ background: `hsl(${p.student_name.charCodeAt(0) * 9 % 360},50%,25%)` }}>{p.student_name[0]}</div>
                    <div><div className="cell-name">{p.student_name}</div><div className="cell-sub">{p.student_email}</div></div>
                  </div>
                </td>
                <td><div className="badge badge-muted">{p.department}</div></td>
                <td>
                  <div className="cell-name">{p.company_name}</div>
                  <div className="cell-sub">{p.role}</div>
                </td>
                <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--emerald)' }}>
                  ₹ {p.package} <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>LPA</span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {p.offer_date ? new Date(p.offer_date).toLocaleDateString() : '—'}
                </td>
                <td>
                  <button className="btn btn-danger btn-icon" title="Revoke" onClick={() => setDeleteId(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {placements.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No placements confirmed yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <Modal title="Revoke Placement" onClose={() => setDeleteId(null)} onSave={handleRevoke} saveLabel="Revoke">
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            This will revoke the placement and mark the student as unplaced again. Use this only for genuine corrections.
          </p>
        </Modal>
      )}
    </>
  );
}
