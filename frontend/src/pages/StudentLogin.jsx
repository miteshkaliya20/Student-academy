import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import studentApi, {
  STUDENT_TOKEN_STORAGE_KEY,
  STUDENT_USER_STORAGE_KEY,
} from '../api/studentApi';
import './StudentLogin.scss';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="login-shell student-login-shell-modern">
      <section className="student-login-grid-modern">
        <article className="student-login-info-card student-login-info-card-modernized">
          <span className="student-login-badge">Student Portal</span>
          <h1>Learn. Attempt. Improve.</h1>
          <p>
            Your personalized dashboard for test analytics, timetable tracking, and academic progress at one place.
          </p>

          <div className="student-login-kpi-row">
            <div>
              <strong>Weekly</strong>
              <span>Mock Tests</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Performance Insights</span>
            </div>
            <div>
              <strong>24x7</strong>
              <span>Portal Access</span>
            </div>
          </div>

          <div className="student-login-info-list">
            <div>
              <strong>Exam Performance</strong>
              <span>Track question-level analytics and monitor your latest score trends.</span>
            </div>
            <div>
              <strong>Class Timetable</strong>
              <span>Stay prepared with your updated weekly schedule and mentor sessions.</span>
            </div>
            <div>
              <strong>Smart Exam Zone</strong>
              <span>Attempt online tests with timers and instant score breakdowns.</span>
            </div>
          </div>

          <div className="student-login-links">
            <Link to="/admission">Student Admission</Link>
            <Link to="/login">Staff/Admin Login</Link>
          </div>
        </article>

        <article className="login-card student-login-card-modern student-login-card-modernized">
          <div className="student-login-card-top">
            <h2>Student Login</h2>
            <p>Use your registered email and password to continue your learning journey.</p>
          </div>

          <button
            type="button"
            className="demo-login-chip student-demo-chip student-demo-chip-modern"
            onClick={() => {
              setForm({ email: 'student@example.com', password: '9876543210' });
              setError('');
            }}
          >
            Use Demo Student Access
          </button>

          <form className="form-grid single-col" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                placeholder="student@example.com"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>

            <label>
              Password
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
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
                {loading ? 'Signing in...' : 'Enter Student Portal'}
              </button>
              <Link className="btn secondary" to="/login">
                Staff/Admin Login
              </Link>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}
