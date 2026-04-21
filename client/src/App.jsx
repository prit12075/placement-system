import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminCompanies from './pages/admin/Companies';
import AdminJobs from './pages/admin/JobPostings';
import AdminApplications from './pages/admin/Applications';
import AdminPlacements from './pages/admin/Placements';

// Student
import StudentDashboard from './pages/student/Dashboard';
import StudentJobs from './pages/student/BrowseJobs';
import StudentApplications from './pages/student/MyApplications';
import StudentProfile from './pages/student/Profile';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, color: 'var(--text-3)' }}>Loading PlaceMe...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="placements" element={<AdminPlacements />} />
            </Route>

            <Route path="/student" element={<PrivateRoute role="student"><StudentLayout /></PrivateRoute>}>
              <Route index element={<StudentDashboard />} />
              <Route path="jobs" element={<StudentJobs />} />
              <Route path="applications" element={<StudentApplications />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
