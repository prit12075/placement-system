import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import { Search } from 'lucide-react';

const STATUS_COLORS = {
  applied: 'badge-sky',
  shortlisted: 'badge-teal',
  interview: 'badge-amber',
  selected: 'badge-emerald',
  rejected: 'badge-coral',
  withdrawn: 'badge-muted',
};

export default function Applications() {
  const api = useApi();
  const toast = useToast();
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  useEffect(() => { load(); }, []);
  const load = () => api.get('/api/admin/applications').then(setApps).catch(e => toast.error(e.error));

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/api/admin/applications/${id}`, { status });
      toast.success('Status updated');
      load();
    } catch (e) { toast.error(e.error); }
  };

  const companies = [...new Set(apps.map(a => a.company_name))].sort();

  const filtered = apps.filter(a => {
    const matchSearch = !search || a.student_name.toLowerCase().includes(search.toLowerCase()) || a.company_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchCompany = !filterCompany || a.company_name === filterCompany;
    return matchSearch && matchStatus && matchCompany;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <span className="page-header-count">{filtered.length} of {apps.length}</span>
        </div>
      </div>

      <div className="filters">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="filter-input" placeholder="Search student or company…" style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select className="filter-select" value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="data-table-wrap">
        <table>
          <thead>
            <tr><th>Student</th><th>Company / Job</th><th>CGPA</th><th>Status</th><th>Applied</th></tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="cell-avatar">
                    <div className="avatar" style={{ background: `hsl(${a.student_name.charCodeAt(0) * 9 % 360},50%,25%)` }}>{a.student_name[0]}</div>
                    <div><div className="cell-name">{a.student_name}</div><div className="cell-sub">{a.department}</div></div>
                  </div>
                </td>
                <td>
                  <div className="cell-name">{a.company_name}</div>
                  <div className="cell-sub">{a.job_title}</div>
                </td>
                <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{a.cgpa}</td>
                <td>
                  <select
                    className="filter-select"
                    style={{ padding: '5px 10px', fontSize: 12, minWidth: 120 }}
                    value={a.status}
                    onChange={e => handleStatus(a.id, e.target.value)}
                  >
                    {['applied', 'shortlisted', 'interview', 'selected', 'rejected'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(a.applied_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No applications match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
