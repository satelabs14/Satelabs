import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page cyber-grid">
      <div className="auth-glow" />

      <div className="auth-card fade-in-up">
        <div className="auth-logo">
          <span className="auth-logo-icon">⬡</span>
          <span className="auth-logo-text">Sate<span>Labs</span></span>
        </div>

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to continue your training</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="operator"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="form-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Authenticating...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          No account yet?{' '}
          <Link to="/register">Create one →</Link>
        </p>

        <div className="auth-terminal mono">
          <span className="terminal-prompt">$</span> satelabs --connect
        </div>
      </div>
    </div>
  );
}
