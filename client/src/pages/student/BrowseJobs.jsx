import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import { MapPin, Building2, Calendar, Clock, Send, AlertTriangle } from 'lucide-react';

export default function BrowseJobs() {
  const api = useApi();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { load() }, []);
  const load = () => api.get('/api/student/jobs').then(setJobs).catch(e => toast.error(e.error));

  const handleApply = async (id) => {
    try {
      await api.post(`/api/student/jobs/${id}/apply`);
      toast.success('Application submitted successfully!');
      load();
    } catch (e) { toast.error(e.error); }
  };

  const filtered = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.company_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Explore Opportunities</h1>
        <p style={{ color: 'var(--text-2)' }}>Discover and apply to placement drives from top companies.</p>
      </div>

      <div className="filters">
        <input className="filter-input" placeholder="Search by role or company..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map(j => (
          <div key={j.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div className="avatar" style={{ background: 'var(--bg-elevated)', width: 24, height: 24, fontSize: 10 }}>{j.company_name[0]}</div>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{j.company_name}</span>
                </div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{j.title}</h2>
                <div style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 16 }}>{j.role}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--emerald)' }}>₹ {parseFloat(j.package_max)} <span style={{fontSize:12, fontWeight:400, color:'var(--text-3)'}}>LPA</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, fontSize: 12, color: 'var(--text-2)' }}>
              {j.location && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14}/> {j.location}</div>}
              {j.drive_date && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14}/> Drive: {new Date(j.drive_date).toLocaleDateString()}</div>}
              {j.deadline && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14}/> Deadline: {new Date(j.deadline).toLocaleDateString()}</div>}
            </div>

            <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', marginBottom: 24, fontSize: 13, color: 'var(--text-2)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Eligibility Criteria</div>
              Min CGPA: <strong>{j.min_cgpa}</strong> • Departments: <strong>{j.eligible_departments}</strong> • Max Backlogs: <strong>{j.max_backlogs}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div>
                {!j.is_eligible && !j.has_applied && <span style={{ color: 'var(--coral)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14}/> Not Eligible</span>}
                {j.has_applied && <span style={{ color: 'var(--sky)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14}/> Successfully Applied</span>}
              </div>
              
              {!j.has_applied && (
                <button 
                  className={`btn ${j.is_eligible ? 'btn-primary' : 'btn-ghost'}`} 
                  disabled={!j.is_eligible} 
                  onClick={() => handleApply(j.id)}
                >
                  <Send size={14}/> Apply Now
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state">No jobs available at the moment.</div>}
      </div>
    </div>
  );
}
