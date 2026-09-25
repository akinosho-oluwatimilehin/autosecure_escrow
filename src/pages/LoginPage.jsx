import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormMessage from '../components/FormMessage';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
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
      await login({
        username: form.email.trim(),
        password: form.password,
      });
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell auth-shell--dark">
      <header className="auth-header">
        <div className="brand" aria-label="AutoSecure Escrow home">
          <span className="brand-mark">A</span>
          <span className="brand-name">AutoSecure</span>
        </div>

        <div className="nav-tag">ESCROW</div>
      </header>

      <div className="auth-stage">
        <div className="auth-card auth-card--compact">
          <div className="auth-mode-toggle">
            <button type="button" className="auth-mode-button" onClick={() => navigate('/register')}>
              Sign up
            </button>
            <button type="button" className="auth-mode-button active">
              Sign in
            </button>
          </div>

          <div className="auth-title-wrap">
            <span className="auth-kicker">WELCOME BACK</span>
            <h1>Sign in to your vault.</h1>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <FormMessage error={error} />

            <div className="field field--light">
              <label htmlFor="email">EMAIL</label>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="field field--light">
              <label htmlFor="password">PASSWORD</label>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
            </div>

            <button className="auth-primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="auth-divider"><span>OR</span></div>

            <button type="button" className="auth-secondary-button">
              Continue with Google
            </button>
          </form>

          <p className="auth-footnote">Funds stay in segregated custody from the first deposit to the final payout.</p>

          <div className="auth-social-row">
            <span className="tiny-icon"><Check size={16} /></span>
            <span className="tiny-icon"><ShieldCheck size={16} /></span>
            <span className="tiny-icon"><ArrowRight size={16} /></span>
            <span className="tiny-icon"><Lock size={16} /></span>
          </div>
        </div>
      </div>
    </main>
  );
}
