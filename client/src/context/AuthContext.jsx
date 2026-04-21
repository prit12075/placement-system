import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('placeme_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { setUser(data.user); setStudent(data.student); })
        .catch(() => { logout(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  function login(data) {
    localStorage.setItem('placeme_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setStudent(data.student || null);
  }

  function logout() {
    localStorage.removeItem('placeme_token');
    setToken(null);
    setUser(null);
    setStudent(null);
  }

  return (
    <AuthContext.Provider value={{ user, student, token, loading, login, logout, setStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
