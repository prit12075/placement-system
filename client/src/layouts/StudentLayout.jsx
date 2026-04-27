import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const LINKS = [
  { to: '/student', label: 'Dashboard' },
  { to: '/student/jobs', label: 'Browse Jobs' },
  { to: '/student/applications', label: 'My Applications' },
  { to: '/student/profile', label: 'Profile' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <nav className="student-nav">
        <div className="student-nav-logo">
          <div className="sidebar-logo-icon" style={{ width: 32, height: 32, fontSize: 14 }}>P</div>
          <h2>PlaceMe</h2>
        </div>

        {LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/student'}
            className={({ isActive }) => `student-nav-link${isActive ? ' active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}

        <div className="student-nav-right">
          <div className="sidebar-avatar avatar-sm" style={{ width: 30, height: 30, fontSize: 11 }}>
            {user?.first_name?.[0] || 'S'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.first_name}</span>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </nav>

      <div className="app-content" style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
