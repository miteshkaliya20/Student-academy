import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Login.scss';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const demoUsers = [
    { label: 'Admin Access', username: 'admin', password: 'admin123' },
    { label: 'Staff Access', username: 'staff', password: 'staff123' },
  ];

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const result = await login(form.username, form.password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError('');
  }

  return (
    <div className="login-shell academy-login-shell academy-login-modern">
      <section className="academy-login-grid academy-login-grid-modern">
        <article className="academy-info-card academy-info-card-modern">
          <span className="academy-badge">Parivartan Learning Hub</span>
          <h1>Parivartan Academy</h1>
          <p>Structured coaching, actionable analytics, and mentor-led guidance for every aspirant.</p>

          <div className="academy-highlights-grid">
            <div className="academy-info-block">
              <h3>Programs</h3>
              <p>GPSC preparation, current affairs sessions, mock tests, and interview guidance.</p>
            </div>

            <div className="academy-info-block">
              <h3>Campus Highlights</h3>
              <p>Experienced mentors, weekly performance tracking, and structured timetable support.</p>
            </div>
          </div>

          <div className="academy-stat-row">
            <div className="academy-stat-card">
              <strong>12+</strong>
              <span>Exam Tracks</span>
            </div>
            <div className="academy-stat-card">
              <strong>50+</strong>
              <span>Weekly Tests</span>
            </div>
            <div className="academy-stat-card">
              <strong>24x7</strong>
              <span>Portal Access</span>
            </div>
          </div>

          <div className="academy-info-links academy-info-links-modern">
            <Link to="/admission" className="academy-link-btn">
              Student Admission Form
            </Link>
            <Link to="/student/login" className="academy-link-btn">
              Student Portal Login
            </Link>
          </div>
        </article>

        <article className="login-card academy-auth-card academy-auth-modern">
          <div className="academy-auth-top">
            <h2>Staff / Admin Login</h2>
            <p>Secure access for Academy operations dashboard.</p>
          </div>

          <div className="demo-login-row">
            {demoUsers.map((account) => (
              <button
                key={account.username}
                type="button"
                className="demo-login-chip"
                onClick={() => {
                  setForm({ username: account.username, password: account.password });
                  setError('');
                }}
              >
                {account.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="form-grid single-col">
            <label>
              Username
              <input
                autoComplete="username"
                placeholder="Enter username"
                value={form.username}
                onChange={(event) => setForm((c) => ({ ...c, username: event.target.value }))}
              />
            </label>
            <label>
              Password
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={form.password}
                onChange={(event) => setForm((c) => ({ ...c, password: event.target.value }))}
              />
            </label>
            <label className="password-toggle-row">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
              />
              Show password
            </label>
            {error ? <div className="error-msg">{error}</div> : null}
            <div className="actions">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}
