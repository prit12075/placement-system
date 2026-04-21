import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, FileText, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/student/dashboard').then(setData).catch(console.error);
  }, [api]);

  if (!data) return <div className="empty-state">Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {data.placement ? (
        <div className="welcome-banner" style={{ background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.1), transparent 70%), var(--bg-card)', borderColor: 'rgba(52,211,153,0.3)' }}>
          <h1 style={{ color: 'var(--emerald)' }}><Trophy style={{display:'inline', marginRight:8}}/> Congratulations, {user.name}!</h1>
          <p>You have been placed at <strong>{data.placement.company_name}</strong> as a <strong>{data.placement.role}</strong>.</p>
          <div style={{ marginTop: 24, padding: 20, background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--r-md)', display: 'inline-flex', gap: 40 }}>
            <div><div style={{fontSize:11, color:'var(--text-3)'}}>Package</div><div style={{fontFamily:'Space Grotesk', fontSize:24, fontWeight:700, color:'var(--emerald)'}}>₹ {data.placement.package} LPA</div></div>
            <div><div style={{fontSize:11, color:'var(--text-3)'}}>Offer Date</div><div style={{fontSize:16, fontWeight:600}}>{new Date(data.placement.offer_date).toLocaleDateString()}</div></div>
          </div>
        </div>
      ) : (
        <div className="welcome-banner">
          <h1>Hello, <span>{user.name}</span></h1>
          <p>Your placement journey starts here. Keep your profile updated and apply for active drives.</p>
          <div className="welcome-chips" style={{marginTop:24}}>
            <Link to="/student/jobs" className="btn btn-primary btn-sm"><Briefcase size={14}/> Browse {data.stats.openJobs} Open Jobs</Link>
          </div>
        </div>
      )}

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-value" style={{color:'var(--accent)'}}>{data.student.cgpa}</div>
          <div className="stat-card-label">Current CGPA</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{color:'var(--violet)'}}>{data.stats.totalApps}</div>
          <div className="stat-card-label">Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{color:'var(--teal)'}}>{data.stats.shortlisted}</div>
          <div className="stat-card-label">Shortlisted Applications</div>
        </div>
      </div>

      <div className="data-table-wrap">
        <div className="data-table-header"><h3>Recent Applications</h3></div>
        <table>
          <thead><tr><th>Company</th><th>Role</th><th>Package</th><th>Status</th></tr></thead>
          <tbody>
            {data.recentApps.map(a => (
              <tr key={a.id}>
                <td style={{fontWeight:600}}>{a.company_name}</td>
                <td>{a.role}</td>
                <td style={{color:'var(--text-2)'}}>{a.package_max} LPA</td>
                <td><div className="badge badge-muted" style={{textTransform:'capitalize'}}>{a.status}</div></td>
              </tr>
            ))}
            {data.recentApps.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', padding:40, color:'var(--text-3)'}}>No applications yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
