import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { authService } from '../services/apiServices';
import FormMessage from '../components/FormMessage';

const roleOptions = [
  {
    value: 'BUYER',
    label: 'Buyer',
    description: 'Purchase vehicles with escrowed funds',
  },
  {
    value: 'DEALERSHIP',
    label: 'Dealer',
    description: 'Licensed car dealerships & verified automotive merchants only',
  },
  {
    value: 'REPAIR_SHOP',
    label: 'Inspector',
    description: 'Verify condition on site',
  },
  {
    value: 'LOGISTICS',
    label: 'Carrier',
    description: 'Transport with live tracking',
  },
];

export function ConfirmEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'example@gmail.com';

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
        <div className="auth-card auth-card--success">
          <div className="success-check"><Check size={28} /></div>

          <div className="auth-title-wrap auth-title-wrap--center">
            <h1>Account created!</h1>
          </div>

          <p className="auth-confirm-copy">
            Your account for <strong>{email}</strong> is ready and active. You can sign in directly with your credentials.
          </p>

          <button type="button" className="auth-primary-button" onClick={() => navigate('/login')}>
            Sign in now
          </button>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'BUYER',
  });
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
      const normalizedName = form.fullName.trim();
      const [first_name, ...rest] = normalizedName.split(' ');
      const last_name = rest.join(' ');
      const usernameBase = (normalizedName || form.email.split('@')[0]).replace(/\s+/g, '_');

      await authService.register({
        username: usernameBase,
        email: form.email,
        password: form.password,
        role: form.role,
        first_name: first_name || '',
        last_name: last_name || '',
        company_name: normalizedName,
      });

      navigate('/confirm-email', { replace: true, state: { email: form.email } });
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to the backend server. Please make sure the Django server is running (python manage.py runserver).');
      } else {
        const data = err.response?.data;
        if (typeof data === 'string') {
          setError(data);
        } else if (data?.password) {
          setError(Array.isArray(data.password) ? data.password.join(' ') : data.password);
        } else if (data?.email) {
          setError(Array.isArray(data.email) ? data.email.join(' ') : data.email);
        } else if (data?.username) {
          setError(Array.isArray(data.username) ? data.username.join(' ') : data.username);
        } else if (data?.detail) {
          setError(data.detail);
        } else if (data?.non_field_errors) {
          setError(Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : data.non_field_errors);
        } else {
          setError(JSON.stringify(data || 'Registration failed.'));
        }
      }
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
        <div className="auth-card auth-card--large">
          <div className="auth-mode-toggle">
            <button type="button" className="auth-mode-button active">
              Sign up
            </button>
            <button type="button" className="auth-mode-button" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </div>

          <div className="auth-title-wrap auth-title-wrap--center">
            <span className="auth-kicker">CREATE YOUR ACCOUNT</span>
            <h1>Join the escrow pipeline.</h1>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <FormMessage error={error} />

            <div className="field field--light">
              <label htmlFor="fullName">FULL NAME OR COMPANY NAME</label>
              <div className="input-wrap">
                <User size={16} />
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Adekola Musa/AutoLogistics"
                  required
                />
              </div>
            </div>

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
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="field field--light field--role">
              <label>YOUR ROLE</label>
              <div className="role-grid">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`role-card ${form.role === option.value ? 'selected' : ''}`}
                    onClick={() => setForm((current) => ({ ...current, role: option.value }))}
                  >
                    <span>{option.label}</span>
                    <small>{option.description}</small>
                  </button>
                ))}
              </div>
            </div>

            <button className="auth-primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create account'}
            </button>

            <div className="auth-divider"><span>OR</span></div>

            <button type="button" className="auth-secondary-button">
              Continue with Google
            </button>
          </form>

          <p className="auth-footnote">Funds stay in segregated custody from the first deposit to the final payout.</p>

          <div className="auth-social-row">
            <span className="tiny-icon"><ArrowRight size={16} /></span>
            <span className="tiny-icon"><ShieldCheck size={16} /></span>
            <span className="tiny-icon"><Check size={16} /></span>
            <span className="tiny-icon"><Mail size={16} /></span>
          </div>
        </div>
      </div>
    </main>
  );
}
