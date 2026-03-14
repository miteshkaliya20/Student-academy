import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import studentApi, {
  STUDENT_TOKEN_STORAGE_KEY,
  STUDENT_USER_STORAGE_KEY,
} from '../api/studentApi';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await studentApi.post('/auth/student-login', form);
      localStorage.setItem(STUDENT_TOKEN_STORAGE_KEY, data.token);
      localStorage.setItem(STUDENT_USER_STORAGE_KEY, JSON.stringify(data.user));
      navigate('/student/portal', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Student login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card">
        <h1>Student Login</h1>
        <p>Demo account</p>
        <p>Email: student@example.com</p>
        <p>Password: 9876543210</p>
        <form className="form-grid single-col" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          {error ? <div className="error-msg">{error}</div> : null}

          <div className="actions">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login as Student'}
            </button>
            <Link className="btn secondary" to="/login">
              Staff/Admin Login
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
