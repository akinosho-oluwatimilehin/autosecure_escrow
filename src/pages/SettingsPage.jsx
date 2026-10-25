import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Moon,
  Phone,
  Save,
  Send,
  ShieldCheck,
  Sun,
  User,
  XCircle,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FormMessage from '../components/FormMessage';
import { authService } from '../services/apiServices';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    company_name: user?.company_name || '',
    address: user?.address || '',
  });

  // Email verification state
  const [emailForm, setEmailForm] = useState({
    email: user?.email || '',
  });
  const [emailStep, setEmailStep] = useState('idle'); // 'idle' | 'code' | 'verified'
  const [emailCode, setEmailCode] = useState('');

  // Phone verification state
  const [phoneForm, setPhoneForm] = useState({
    phone: user?.phone || '',
  });
  const [phoneStep, setPhoneStep] = useState('idle'); // 'idle' | 'code' | 'verified'
  const [phoneCode, setPhoneCode] = useState('');

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    escrowUpdates: true,
    inspectionReports: true,
    transitMilestones: true,
  });

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updated = await authService.updateProfile(profileForm);
      updateUser(updated);
      setSuccess('Profile details successfully updated.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Update / Verify Request
  const handleEmailSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updated = await authService.updateProfile({ email: emailForm.email, is_email_verified: false });
      updateUser(updated);
      setSuccess('Email address updated. Please verify using code 123456.');
      setEmailStep('code');
    } catch (err) {
      setError(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to update email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.verifyEmail(emailCode);
      updateUser({ is_email_verified: true, email: emailForm.email });
      setEmailStep('idle');
      setEmailCode('');
      setSuccess('Email address has been verified successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code. (Try 123456)');
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone Update / Verify Request
  const handlePhoneSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updated = await authService.updateProfile({ phone: phoneForm.phone, is_phone_verified: false });
      updateUser(updated);
      setSuccess('Phone number saved. SMS verification code sent. Enter 123456 to verify.');
      setPhoneStep('code');
    } catch (err) {
      setError(err.response?.data?.phone?.[0] || err.response?.data?.detail || 'Failed to save phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.verifyPhone({ phone: phoneForm.phone, code: phoneCode });
      updateUser({ is_phone_verified: true, phone: phoneForm.phone });
      setPhoneStep('idle');
      setPhoneCode('');
      setSuccess('Phone number has been verified successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid SMS verification code. (Try 123456)');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setSuccess('Password changed successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const isEmailVerified = !!user?.is_email_verified;
  const isPhoneVerified = !!user?.is_phone_verified;

  return (
    <AppLayout
      title="Account Settings"
      subtitle="Manage your identity, security credentials, appearance, and escrow notification preferences."
    >
      <div className="stack">
        <FormMessage error={error} success={success} />

        <div className="settings-container">
          {/* Navigation Sidebar */}
          <nav className="settings-nav-panel">
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
            >
              <User size={18} /> Profile & Names
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => { setActiveTab('contact'); setError(''); setSuccess(''); }}
            >
              <Mail size={18} /> Email & Phone
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => { setActiveTab('appearance'); setError(''); setSuccess(''); }}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Theme & Display
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
            >
              <KeyRound size={18} /> Security & Password
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => { setActiveTab('notifications'); setError(''); setSuccess(''); }}
            >
              <Bell size={18} /> Notifications
            </button>
          </nav>

          {/* Tab Content Panes */}
          <main className="settings-content-pane">
            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
              <section className="panel stack">
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <h2 className="panel-title" style={{ margin: 0 }}>Personal & Business Details</h2>
                  <span className="status-pill">{user?.role}</span>
                </div>
                <p className="meta">Keep your registered legal name and business address current for escrow verification.</p>

                <form className="form-grid" onSubmit={handleProfileSubmit}>
                  <div className="grid two">
                    <div className="field">
                      <label htmlFor="first_name">FIRST NAME</label>
                      <input
                        id="first_name"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        placeholder="Adekola"
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="last_name">LAST NAME</label>
                      <input
                        id="last_name"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        placeholder="Musa"
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="company_name">COMPANY OR REGISTERED DEALERSHIP NAME</label>
                    <input
                      id="company_name"
                      value={profileForm.company_name}
                      onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                      placeholder="AutoLogistics International Ltd / Musa Motors"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="address">PHYSICAL / LOT ADDRESS</label>
                    <textarea
                      id="address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="12 Commercial Avenue, Victoria Island, Lagos, Nigeria"
                    />
                  </div>

                  <div className="actions" style={{ marginTop: 12 }}>
                    <button className="button primary" type="submit" disabled={loading}>
                      <Save size={16} /> {loading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* 2. CONTACT & VERIFICATION TAB */}
            {activeTab === 'contact' && (
              <div className="stack">
                {/* Email Verification Card */}
                <section className="panel stack">
                  <div className="actions" style={{ justifyContent: 'space-between' }}>
                    <h2 className="panel-title" style={{ margin: 0 }}>Email Address</h2>
                    {isEmailVerified ? (
                      <span className="verified-pill"><CheckCircle2 size={14} /> Verified</span>
                    ) : (
                      <span className="unverified-pill"><XCircle size={14} /> Verification Required</span>
                    )}
                  </div>
                  <p className="meta">Escrow contract notifications, deposit receipts, and payout releases are dispatched here.</p>

                  <form className="form-grid" onSubmit={handleEmailSave}>
                    <div className="field">
                      <label htmlFor="email">EMAIL ADDRESS</label>
                      <input
                        id="email"
                        type="email"
                        value={emailForm.email}
                        onChange={(e) => setEmailForm({ email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="actions">
                      <button className="button secondary" type="submit" disabled={loading}>
                        {isEmailVerified ? 'Update Email Address' : 'Request Verification Code'}
                      </button>
                      {!isEmailVerified && emailStep === 'idle' && (
                        <button
                          className="button primary"
                          type="button"
                          onClick={() => setEmailStep('code')}
                        >
                          <Send size={15} /> Enter 6-Digit Code
                        </button>
                      )}
                    </div>
                  </form>

                  {emailStep === 'code' && (
                    <form className="verify-box" onSubmit={handleVerifyEmail}>
                      <strong>Enter 6-Digit Email Verification Code</strong>
                      <p className="meta" style={{ margin: 0 }}>
                        A verification code was simulated for <strong>{emailForm.email}</strong>. Enter <strong>123456</strong> below:
                      </p>
                      <div className="actions">
                        <input
                          type="text"
                          maxLength={6}
                          style={{ maxWidth: 180, letterSpacing: '3px', fontWeight: 700 }}
                          placeholder="123456"
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value)}
                          required
                        />
                        <button className="button primary" type="submit" disabled={loading}>
                          <CheckCircle2 size={16} /> Confirm Email
                        </button>
                        <button className="button ghost" type="button" onClick={() => setEmailStep('idle')}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </section>

                {/* Phone Verification Card */}
                <section className="panel stack">
                  <div className="actions" style={{ justifyContent: 'space-between' }}>
                    <h2 className="panel-title" style={{ margin: 0 }}>Phone Number</h2>
                    {isPhoneVerified ? (
                      <span className="verified-pill"><CheckCircle2 size={14} /> Verified</span>
                    ) : (
                      <span className="unverified-pill"><XCircle size={14} /> Unverified</span>
                    )}
                  </div>
                  <p className="meta">Used for instantaneous carrier transit alerts, driver pickups, and urgent escrow security pins.</p>

                  <form className="form-grid" onSubmit={handlePhoneSave}>
                    <div className="field">
                      <label htmlFor="phone">PHONE NUMBER</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phoneForm.phone}
                        onChange={(e) => setPhoneForm({ phone: e.target.value })}
                        placeholder="+234 801 234 5678"
                        required
                      />
                    </div>
                    <div className="actions">
                      <button className="button secondary" type="submit" disabled={loading}>
                        Save Phone Number
                      </button>
                      {!isPhoneVerified && phoneStep === 'idle' && (
                        <button
                          className="button primary"
                          type="button"
                          onClick={() => setPhoneStep('code')}
                        >
                          <Send size={15} /> Verify via SMS Code
                        </button>
                      )}
                    </div>
                  </form>

                  {phoneStep === 'code' && (
                    <form className="verify-box" onSubmit={handleVerifyPhone}>
                      <strong>Enter 6-Digit SMS Verification Code</strong>
                      <p className="meta" style={{ margin: 0 }}>
                        SMS code dispatched to <strong>{phoneForm.phone || 'your phone'}</strong>. Enter <strong>123456</strong> below:
                      </p>
                      <div className="actions">
                        <input
                          type="text"
                          maxLength={6}
                          style={{ maxWidth: 180, letterSpacing: '3px', fontWeight: 700 }}
                          placeholder="123456"
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value)}
                          required
                        />
                        <button className="button primary" type="submit" disabled={loading}>
                          <CheckCircle2 size={16} /> Confirm Phone
                        </button>
                        <button className="button ghost" type="button" onClick={() => setPhoneStep('idle')}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              </div>
            )}

            {/* 3. APPEARANCE & THEME TAB */}
            {activeTab === 'appearance' && (
              <section className="panel stack">
                <h2 className="panel-title" style={{ margin: 0 }}>Theme & Display Settings</h2>
                <p className="meta">Choose between high-contrast dark vault mode or crisp daylight clarity. Your choice is instantly applied across all dashboards.</p>

                <div className="theme-mode-grid" style={{ marginTop: 12 }}>
                  <div
                    className={`theme-mode-card ${theme === 'dark' ? 'selected' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon size={36} color="#14b8a6" />
                    <div>
                      <strong>Dark Vault (Recommended)</strong>
                      <div className="meta">High-contrast, sleek financial palette with reduced eye strain.</div>
                    </div>
                    {theme === 'dark' && <span className="verified-pill"><CheckCircle2 size={14} /> Active</span>}
                  </div>

                  <div
                    className={`theme-mode-card ${theme === 'light' ? 'selected' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <Sun size={36} color="#f59e0b" />
                    <div>
                      <strong>Daylight Bright</strong>
                      <div className="meta">Clean, high-visibility light theme optimized for well-lit environments.</div>
                    </div>
                    {theme === 'light' && <span className="verified-pill"><CheckCircle2 size={14} /> Active</span>}
                  </div>
                </div>
              </section>
            )}

            {/* 4. SECURITY & PASSWORD TAB */}
            {activeTab === 'security' && (
              <section className="panel stack">
                <h2 className="panel-title" style={{ margin: 0 }}>Change Vault Password</h2>
                <p className="meta">Ensure your password contains at least 8 characters with a mix of letters, numbers, and symbols.</p>

                <form className="form-grid" onSubmit={handlePasswordSubmit}>
                  <div className="field">
                    <label htmlFor="old_password">CURRENT PASSWORD</label>
                    <input
                      id="old_password"
                      type="password"
                      value={passwordForm.old_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="grid two">
                    <div className="field">
                      <label htmlFor="new_password">NEW PASSWORD</label>
                      <input
                        id="new_password"
                        type="password"
                        minLength={8}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="At least 8 characters"
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="confirm_password">CONFIRM NEW PASSWORD</label>
                      <input
                        id="confirm_password"
                        type="password"
                        minLength={8}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        placeholder="Re-type new password"
                        required
                      />
                    </div>
                  </div>

                  <div className="actions" style={{ marginTop: 12 }}>
                    <button className="button primary" type="submit" disabled={loading}>
                      <Lock size={16} /> {loading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* 5. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <section className="panel stack">
                <h2 className="panel-title" style={{ margin: 0 }}>Escrow Milestone Notifications</h2>
                <p className="meta">Configure how and when AutoSecure Escrow alerts you about deal transitions.</p>

                <div className="stack" style={{ marginTop: 10 }}>
                  {[
                    { key: 'escrowUpdates', label: 'Escrow Funding & Release Alerts', desc: 'Notify immediately when buyer funds enter segregation or seller payout completes.' },
                    { key: 'inspectionReports', label: 'Field Inspection Diagnostic Results', desc: 'Receive instant report copies as soon as a certified mechanic signs off on vehicle condition.' },
                    { key: 'transitMilestones', label: 'Carrier Live GPS & Transit Updates', desc: 'Get SMS and push alerts when carrier picks up or delivers the vehicle.' },
                    { key: 'emailAlerts', label: 'Daily Activity Summary Email', desc: 'Receive a daily digest of active contracts and milestone receipts.' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="verification-status-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    >
                      <div>
                        <strong>{item.label}</strong>
                        <div className="meta">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={() => {}}
                        style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#14b8a6' }}
                      />
                    </div>
                  ))}
                </div>

                <div className="actions" style={{ marginTop: 12 }}>
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => setSuccess('Notification preferences saved.')}
                  >
                    Save Preferences
                  </button>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
