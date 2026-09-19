import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormMessage from '../components/FormMessage';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your username and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <div className="brand" style={{ color: '#0f172a', marginBottom: 18 }}>
          <span className="brand-mark"><ShieldCheck size={18} /></span>
          <span>AutoSecure Escrow</span>
        </div>
        <h1 className="page-title">Sign in</h1>
        <p className="page-subtitle">Access your vehicle escrow workspace.</p>
        <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: 18 }}>
          <FormMessage error={error} />
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" value={form.username} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>
          <button className="button primary" type="submit" disabled={submitting}>
            <LogIn size={17} /> {submitting ? 'Signing in...' : 'Sign in'}
          </button>
          <Link to="/register" className="button ghost">Create account</Link>
        </form>
      </section>
    </main>
  );
}
