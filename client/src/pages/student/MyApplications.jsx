import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import { FileText, Trash2, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';

export default function MyApplications() {
  const api = useApi();
  const toast = useToast();
  const [apps, setApps] = useState([]);

  useEffect(() => { load() }, []);
  const load = () => api.get('/api/student/applications').then(setApps).catch(e => toast.error(e.error));

  const handleWithdraw = async (id) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await api.del(`/api/student/applications/${id}`);
      toast.success('Application withdrawn');
      load();
    } catch (e) { toast.error(e.error); }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'selected': return <CheckCircle size={16} color="var(--emerald)" />;
      case 'rejected': return <XCircle size={16} color="var(--coral)" />;
      case 'withdrawn': return <XCircle size={16} color="var(--text-3)" />;
      default: return <Clock size={16} color="var(--amber)" />;
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>My Applications</h1>
        <p style={{ color: 'var(--text-2)' }}>Track the status of your placement applications.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {apps.map(a => (
          <div key={a.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="avatar" style={{ width: 44, height: 44, fontSize: 16, background: 'var(--bg-elevated)' }}>{a.company_name[0]}</div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{a.job_title}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{a.company_name} • Applied {new Date(a.applied_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 8 }}>
                  {getStatusIcon(a.status)}
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{a.status}</span>
                </div>
                {a.status === 'applied' && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--coral)' }} onClick={() => handleWithdraw(a.id)}>
                    <Trash2 size={12}/> Withdraw
                  </button>
                )}
              </div>
            </div>

            {/* Pipeline Visualization */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 32, left: 20, right: 20, height: 2, background: 'var(--bg-elevated)', zIndex: 0 }}></div>
              
              {['applied', 'shortlisted', 'interview', 'selected'].map((step, idx) => {
                const stages = ['applied', 'shortlisted', 'interview', 'selected'];
                const currentIdx = stages.indexOf(a.status === 'rejected' || a.status === 'withdrawn' ? 'applied' : a.status);
                const isPast = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const isRejected = a.status === 'rejected' && isCurrent;

                return (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--bg-base)',
                      border: `2px solid ${isRejected ? 'var(--coral)' : isCurrent ? 'var(--accent)' : isPast ? 'var(--emerald)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isPast && !isRejected && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--emerald)' }}></div>}
                      {isCurrent && !isRejected && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent)' }}></div>}
                      {isRejected && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--coral)' }}></div>}
                    </div>
                    <span style={{ fontSize: 11, color: isCurrent ? 'var(--text-1)' : 'var(--text-3)', fontWeight: isCurrent ? 600 : 400, textTransform: 'capitalize' }}>
                      {isRejected ? 'Rejected' : step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {apps.length === 0 && <div className="empty-state">You haven't applied to any drives yet.</div>}
      </div>
    </div>
  );
}
