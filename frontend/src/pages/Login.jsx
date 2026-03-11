import { useState } from 'react';
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
    <div className="login-shell">
      <section className="login-card">
        <h1>Student Academy Login</h1>
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
      </section>
    </div>
  );
}
