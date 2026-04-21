import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Building2, Briefcase, Trophy, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
ChartJS.defaults.color = '#9c9589';

export default function Dashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/admin/stats').then(setStats).catch(console.error);
  }, [api]);

  if (!stats) return <div className="empty-state">Loading dashboard...</div>;

  const barData = {
    labels: stats.deptStats.map(d => d.department),
    datasets: [
      { label: 'Total', data: stats.deptStats.map(d => d.total_students), backgroundColor: 'rgba(139,124,246,0.3)', borderColor: '#8b7cf6', borderWidth: 1, borderRadius: 4 },
      { label: 'Placed', data: stats.deptStats.map(d => d.placed_students), backgroundColor: 'rgba(52,211,153,0.3)', borderColor: '#34d399', borderWidth: 1, borderRadius: 4 },
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { family: 'Inter', size: 11 } } } },
    scales: { x: { grid: { color: 'rgba(255,255,255,0.03)' } }, y: { grid: { color: 'rgba(255,255,255,0.03)' } } }
  };

  const donutData = {
    labels: stats.jobStatus.map(d => d.status),
    datasets: [{
      data: stats.jobStatus.map(d => d.count),
      backgroundColor: ['#c8a97d', '#5eead4', '#8b7cf6', '#f87171'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
  const donutOptions = { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom' } } };

  return (
    <>
      <div className="welcome-banner">
        <h1>Welcome, <span>{user.name}</span></h1>
        <p>Placement Command Centre. Track student outcomes, manage incoming drives, and monitor campus placement performance.</p>
        <div className="welcome-chips">
          <div className="welcome-chip"><TrendingUp /> Active Placement Season ({new Date().getFullYear()})</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon violet"><GraduationCap size={20} /></div>
          <div className="stat-card-value">{stats.totalStudents}</div>
          <div className="stat-card-label">Total Students</div>
          <div className="stat-card-sub"><span style={{color:'var(--violet)'}}>Active Batch</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon teal"><Building2 size={20} /></div>
          <div className="stat-card-value">{stats.totalCompanies}</div>
          <div className="stat-card-label">Partner Companies</div>
          <div className="stat-card-sub"><span style={{color:'var(--teal)'}}>Recruiting Partners</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><Briefcase size={20} /></div>
          <div className="stat-card-value">{stats.totalJobs}</div>
          <div className="stat-card-label">Total Drives</div>
          <div className="stat-card-sub"><span style={{color:'var(--amber)'}}>This Season</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon emerald"><Trophy size={20} /></div>
          <div className="stat-card-value">{stats.totalPlacements}</div>
          <div className="stat-card-label">Students Placed</div>
          <div className="stat-card-sub"><span style={{color:'var(--emerald)'}}>{stats.placementRate}% Placement Rate</span></div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><TrendingUp /> Department Performance</h3>
          </div>
          <div style={{ height: 260 }}><Bar data={barData} options={barOptions} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><Briefcase /> Drive Pipeline</h3>
          </div>
          <div style={{ height: 260 }}><Doughnut data={donutData} options={donutOptions} /></div>
        </div>
      </div>

      <div className="data-table-wrap">
        <div className="data-table-header"><h3>Recent Placements</h3></div>
        <table>
          <thead><tr><th>Student</th><th>Company</th><th>Role</th><th>Package</th><th>Date</th></tr></thead>
          <tbody>
            {stats.recentPlacements.map((p, i) => (
              <tr key={i}>
                <td>
                  <div className="cell-avatar">
                    <div className="avatar" style={{background: 'var(--bg-elevated)'}}>{p.student_name[0]}</div>
                    <div>
                      <div className="cell-name">{p.student_name}</div>
                      <div className="cell-sub">{p.department}</div>
                    </div>
                  </div>
                </td>
                <td style={{fontWeight:600}}>{p.company_name}</td>
                <td><div className="badge badge-muted">{p.role}</div></td>
                <td style={{color:'var(--emerald)', fontWeight:600}}>{p.package} LPA</td>
                <td style={{color:'var(--text-3)', fontSize:12}}>{new Date(p.offer_date).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentPlacements.length === 0 && (
              <tr><td colSpan={5} style={{textAlign:'center', color:'var(--text-3)'}}>No recent placements</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
