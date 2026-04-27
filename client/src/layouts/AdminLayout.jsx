import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, GraduationCap, Building2, Briefcase, FileText, Trophy, LogOut } from 'lucide-react';

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', section: 'Overview' },
  { to: '/admin/students', icon: GraduationCap, label: 'Students', section: 'Manage' },
  { to: '/admin/companies', icon: Building2, label: 'Companies' },
  { to: '/admin/jobs', icon: Briefcase, label: 'Job Postings' },
  { to: '/admin/applications', icon: FileText, label: 'Applications', section: 'Track' },
  { to: '/admin/placements', icon: Trophy, label: 'Placements' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  let lastSection = null;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">P</div>
          <div className="sidebar-logo-text">
            <h2>PlaceMe</h2>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => {
            const showSection = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;
            return (
              <div key={item.to}>
                {showSection && <div className="sidebar-section">{item.section}</div>}
                <NavLink to={item.to} end={item.to === '/admin'} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.first_name?.[0] || 'A'}</div>
          <div className="sidebar-user-info">
            <h4>{user?.first_name ? `${user.first_name} ${user.last_name}` : 'Admin'}</h4>
            <span>Placement Officer</span>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
