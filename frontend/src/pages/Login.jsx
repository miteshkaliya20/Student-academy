import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="login-shell academy-login-shell">
      <section className="academy-login-grid">
        <article className="academy-info-card">
          <h1>Parivartan Academy</h1>
          <p>Transforming aspirants into successful Gujarat Government officers.</p>

          <div className="academy-info-block">
            <h3>Programs</h3>
            <p>GPSC preparation, current affairs sessions, mock tests, and interview guidance.</p>
          </div>

          <div className="academy-info-block">
            <h3>Campus Highlights</h3>
            <p>Experienced mentors, weekly performance tracking, and structured timetable support.</p>
          </div>

          <div className="academy-info-links">
            <Link to="/admission">Public Admission Form</Link>
            <Link to="/student/login">Student Portal Login</Link>
          </div>
        </article>

        <article className="login-card academy-auth-card">
          <h2>Staff / Admin Login</h2>
          <p>Use admin/admin123 or staff/staff123</p>

          <form onSubmit={handleSubmit} className="form-grid single-col">
            <label>
              Username
              <input
                value={form.username}
                onChange={(event) => setForm((c) => ({ ...c, username: event.target.value }))}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((c) => ({ ...c, password: event.target.value }))}
              />
            </label>
            {error ? <div className="error-msg">{error}</div> : null}
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
