import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import { LogIn, UserPlus, Eye, EyeOff, Shield } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE', 'IT', 'Chemical'];
const BATCH_YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);

export default function Login() {
  const { login, user } = useAuth();
  const api = useApi();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '',
    enrollment_no: '', department: '', batch_year: '',
    cgpa: '', tenth_pct: '', twelfth_pct: '',
  });

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/student');
  }, [user, navigate]);

  const set = (field) => (e) => { setError(''); setForm(p => ({ ...p, [field]: e.target.value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await api.post('/api/auth/login', { email: form.email, password: form.password });
        login(data);
        toast.success(`Welcome back, ${data.user.name}`);
        navigate(data.user.role === 'admin' ? '/admin' : '/student');
      } else {
        if (!form.department) { setError('Please select your department'); return; }
        if (!form.batch_year) { setError('Please select your batch year'); return; }
        const payload = {
          name: form.name, email: form.email, password: form.password,
          phone: form.phone || undefined,
          enrollment_no: form.enrollment_no,
          department: form.department,
          batch_year: parseInt(form.batch_year),
          cgpa: form.cgpa ? parseFloat(form.cgpa) : 0,
          tenth_pct: form.tenth_pct ? parseFloat(form.tenth_pct) : 0,
          twelfth_pct: form.twelfth_pct ? parseFloat(form.twelfth_pct) : 0,
        };
        const data = await api.post('/api/auth/register', payload);
        login(data);
        toast.success('Account created. Welcome to PlaceMe!');
        navigate('/student');
      }
    } catch (err) {
      const msg = err.error || 'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(''); };

  return (
    <div className="auth-root">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-brand-logo">P</div>
          <span className="auth-brand-name">PlaceMe</span>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')} type="button">
              <LogIn size={14} /> Sign In
            </button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')} type="button">
              <UserPlus size={14} /> Register
            </button>
          </div>

          <div className="auth-card-inner">
            <div className="auth-heading">
              <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
              <p>{mode === 'login' ? 'Sign in to your placement portal' : 'Register as a student to access placement drives'}</p>
            </div>

            {error && (
              <div className="auth-error">
                <Shield size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {mode === 'register' && (
                <>
                  <div className="auth-section-label">Personal Info</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input value={form.name} onChange={set('name')} required placeholder="Arjun Sharma" />
                    </div>
                    <div className="form-group">
                      <label>Phone <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                      <input value={form.phone} onChange={set('phone')} placeholder="9876543210" type="tel" />
                    </div>
                  </div>

                  <div className="auth-section-label">Academic Details</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Enrollment No *</label>
                      <input value={form.enrollment_no} onChange={set('enrollment_no')} required placeholder="CS2021001" />
                    </div>
                    <div className="form-group">
                      <label>Batch Year *</label>
                      <select value={form.batch_year} onChange={set('batch_year')} required>
                        <option value="">Select year</option>
                        {BATCH_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Department *</label>
                    <select value={form.department} onChange={set('department')} required>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="form-row three-col">
                    <div className="form-group">
                      <label>CGPA</label>
                      <input type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={set('cgpa')} placeholder="8.50" />
                    </div>
                    <div className="form-group">
                      <label>10th %</label>
                      <input type="number" step="0.01" min="0" max="100" value={form.tenth_pct} onChange={set('tenth_pct')} placeholder="85.00" />
                    </div>
                    <div className="form-group">
                      <label>12th %</label>
                      <input type="number" step="0.01" min="0" max="100" value={form.twelfth_pct} onChange={set('twelfth_pct')} placeholder="82.00" />
                    </div>
                  </div>

                  <div className="auth-section-label">Account Credentials</div>
                </>
              )}

              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" value={form.email} onChange={set('email')} required placeholder="name@college.edu" autoComplete="email" />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Password *</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  required placeholder="••••••••" minLength={6}
                  style={{ paddingRight: 42 }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: 12, bottom: 11, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, display: 'flex' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading
                  ? <span className="auth-spinner" />
                  : mode === 'login'
                    ? <><LogIn size={15} /> Sign In</>
                    : <><UserPlus size={15} /> Create Account</>
                }
              </button>
            </form>
          </div>
        </div>

        <p className="auth-hint">
          {mode === 'login'
            ? <>New student? <button className="auth-link" onClick={() => switchMode('register')}>Create an account</button></>
            : <>Already registered? <button className="auth-link" onClick={() => switchMode('login')}>Sign in instead</button></>
          }
        </p>
      </div>
    </div>
  );
}
