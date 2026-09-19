import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { authService } from '../services/apiServices';
import FormMessage from '../components/FormMessage';

const roles = [
  ['BUYER', 'Buyer'],
  ['DEALERSHIP', 'Dealership'],
  ['REPAIR_SHOP', 'Repair shop'],
  ['LOGISTICS', 'Logistics carrier'],
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'BUYER',
    company_name: '',
    phone: '',
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
      await authService.register(form);
      navigate('/login', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'string' ? data : JSON.stringify(data || 'Registration failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <h1 className="page-title">Create account</h1>
        <p className="page-subtitle">Choose the role that matches how you use AutoSecure.</p>
        <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: 18 }}>
          <FormMessage error={error} />
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" value={form.username} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" minLength="8" value={form.password} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="company_name">Company name</label>
            <input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <button className="button primary" type="submit" disabled={submitting}>
            <UserPlus size={17} /> {submitting ? 'Creating...' : 'Create account'}
          </button>
          <Link to="/login" className="button ghost">Back to sign in</Link>
        </form>
      </section>
    </main>
  );
}
