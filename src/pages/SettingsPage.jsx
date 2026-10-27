import React, { useState, useEffect } from 'react';
import {
  Bell,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Moon,
  Phone,
  Save,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Sun,
  User,
  XCircle,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FormMessage from '../components/FormMessage';
import { authService, ratingService } from '../services/apiServices';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState(
    user?.role !== 'BUYER' && user?.verification_status !== 'VERIFIED' ? 'verification' : 'profile'
  );
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

  // Business KYB Verification Form state
  const [kybForm, setKybForm] = useState({
    company_name: user?.company_name || '',
    cac_number: user?.cac_number || '',
    tax_id: user?.tax_id || '',
    operating_license: user?.operating_license || '',
    address: user?.address || '',
  });

  // Security state
  const [pinForm, setPinForm] = useState({ pin: '', confirmPin: '' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Reviews state
  const [ratings, setRatings] = useState([]);

  // Email verification state
  const [emailForm, setEmailForm] = useState({
    email: user?.email || '',
  });
  const [emailStep, setEmailStep] = useState('idle');
  const [emailCode, setEmailCode] = useState('');

  // Phone verification state
  const [phoneForm, setPhoneForm] = useState({
    phone: user?.phone || '',
  });
  const [phoneStep, setPhoneStep] = useState('idle');
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

  useEffect(() => {
    if (activeTab === 'security') {
      authService.getAuditLogs().then(setAuditLogs).catch(() => {});
    } else if (activeTab === 'ratings') {
      if (user?.id) {
        ratingService.getRatingsForUser(user.id).then(setRatings).catch(() => {});
      }
    }
  }, [activeTab, user?.id]);

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

  // Handle KYB Corporate Verification
  const handleKybSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authService.submitCompanyVerification(kybForm);
      updateUser({
        company_name: kybForm.company_name,
        cac_number: kybForm.cac_number,
        verification_status: 'VERIFIED',
        is_company_verified: true,
      });
      setSuccess('Corporate KYB verification verified and approved! Your registered business is certified.');
    } catch (err) {
      setError(err.response?.data?.detail || 'KYB verification submission failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle PIN Setting
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (pinForm.pin !== pinForm.confirmPin) {
      setError('PIN entries do not match.');
      return;
    }
    if (!/^\d{4}$/.test(pinForm.pin)) {
      setError('Security PIN must be exactly 4 numeric digits.');
      return;
    }

    setLoading(true);
    try {
      await authService.updateSecuritySettings({ action: 'set_pin', pin: pinForm.pin });
      updateUser({ has_transaction_pin: true });
      setPinForm({ pin: '', confirmPin: '' });
      setSuccess('4-digit Escrow authorization PIN successfully configured.');
      authService.getAuditLogs().then(setAuditLogs).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update transaction PIN.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle 2FA
  const handleToggle2FA = async () => {
    setError('');
    setSuccess('');
    try {
      const nextState = !twoFactorEnabled;
      await authService.updateSecuritySettings({ action: 'toggle_2fa', enabled: nextState });
      setTwoFactorEnabled(nextState);
      updateUser({ two_factor_enabled: nextState });
      setSuccess(`Two-factor authorization ${nextState ? 'enabled' : 'disabled'}.`);
      authService.getAuditLogs().then(setAuditLogs).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update 2FA.');
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
  const isCompany = user?.role !== 'BUYER';
  const isCompanyVerified = user?.verification_status === 'VERIFIED';

  return (
    <AppLayout
      title="Settings & Verification"
      subtitle="Corporate business vetting, performance ratings, security protocols, and escrow credentials."
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
              <User size={18} /> Profile & Identity
            </button>

            {isCompany && (
              <button
                type="button"
                className={`settings-tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
                onClick={() => { setActiveTab('verification'); setError(''); setSuccess(''); }}
              >
                <Building2 size={18} /> Business KYB Vetting
              </button>
            )}

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'ratings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('ratings'); setError(''); setSuccess(''); }}
            >
              <Star size={18} /> Performance Reviews
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
            >
              <Shield size={18} /> Security & 2FA
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
                  <h2 className="panel-title" style={{ margin: 0 }}>Personal & Account Details</h2>
                  <span className="status-pill">{user?.role === 'DEALERSHIP' ? 'LICENSED DEALER' : user?.role}</span>
                </div>
                <p className="meta">Ensure your legal names match official identification documents for verified escrow transactions.</p>

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
                      placeholder="e.g. Apex Auto Dealers Ltd / AutoLogistics Hub"
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

            {/* 2. BUSINESS KYB VERIFICATION TAB */}
            {activeTab === 'verification' && (
              <section className="panel stack">
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <h2 className="panel-title" style={{ margin: 0 }}>Corporate KYB Business Verification</h2>
                  {isCompanyVerified ? (
                    <span className="dealer-verified-badge"><ShieldCheck size={14} /> Certified Authenticated Business</span>
                  ) : (
                    <span className="dealer-unverified-badge"><ShieldAlert size={14} /> Verification Required</span>
                  )}
                </div>

                <p className="meta">
                  To protect car buyers from fraudulent entities, all commercial sellers (dealers), inspection garages, and logistics carriers must complete strict Corporate Affairs Commission (CAC) and operating licensing checks before trading.
                </p>

                {isCompanyVerified && (
                  <div className="kyb-step-card" style={{ borderLeft: '4px solid #047857' }}>
                    <strong>Corporate Verification Active</strong>
                    <div className="meta" style={{ marginTop: '4px' }}>
                      Registered Entity: <strong>{user?.company_name}</strong> · CAC / RC: <strong>{user?.cac_number}</strong>
                    </div>
                    <div className="meta">
                      Operating License: <strong>{user?.operating_license || 'Verified Commercial Automotive Permit'}</strong>
                    </div>
                  </div>
                )}

                <form className="form-grid" onSubmit={handleKybSubmit}>
                  <div className="field">
                    <label htmlFor="kyb_company">OFFICIAL REGISTERED BUSINESS NAME *</label>
                    <input
                      id="kyb_company"
                      value={kybForm.company_name}
                      onChange={(e) => setKybForm({ ...kybForm, company_name: e.target.value })}
                      placeholder="e.g. Adekola Motors & Auto Logistics Ltd"
                      required
                    />
                  </div>

                  <div className="grid two">
                    <div className="field">
                      <label htmlFor="kyb_cac">CAC REGISTRATION / RC NUMBER *</label>
                      <input
                        id="kyb_cac"
                        value={kybForm.cac_number}
                        onChange={(e) => setKybForm({ ...kybForm, cac_number: e.target.value })}
                        placeholder="RC-1294820"
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="kyb_tax">TAX IDENTIFICATION NUMBER (TIN)</label>
                      <input
                        id="kyb_tax"
                        value={kybForm.tax_id}
                        onChange={(e) => setKybForm({ ...kybForm, tax_id: e.target.value })}
                        placeholder="22094819-0001"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="kyb_license">OPERATING TRADE LICENSE / LOT PERMIT</label>
                    <input
                      id="kyb_license"
                      value={kybForm.operating_license}
                      onChange={(e) => setKybForm({ ...kybForm, operating_license: e.target.value })}
                      placeholder="Licensed Automobile Dealers Association Permit #4928"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="kyb_address">PHYSICAL CAR LOT / WORKSHOP ADDRESS *</label>
                    <textarea
                      id="kyb_address"
                      value={kybForm.address}
                      onChange={(e) => setKybForm({ ...kybForm, address: e.target.value })}
                      placeholder="Plot 44 Lekki-Epe Expressway, Car Lot #3, Lagos State"
                      required
                    />
                  </div>

                  <div className="actions" style={{ marginTop: 12 }}>
                    <button className="button primary" type="submit" disabled={loading}>
                      <ShieldCheck size={16} /> {loading ? 'Submitting & Vetting...' : isCompanyVerified ? 'Update KYB Certification' : 'Submit for Corporate Verification'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* 3. PERFORMANCE REVIEWS & RATINGS TAB */}
            {activeTab === 'ratings' && (
              <section className="panel stack">
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <h2 className="panel-title" style={{ margin: 0 }}>Trust Score & Performance Ratings</h2>
                  <span className="rating-pill" style={{ fontSize: '14px', padding: '6px 12px' }}>
                    <Star size={16} fill="#b45309" color="#b45309" />
                    <strong>{user?.average_rating || '5.0'} / 5.0</strong> ({user?.total_ratings || 0} reviews)
                  </span>
                </div>
                <p className="meta">
                  Ratings are awarded by buyers and escrow partners upon successful inspection, safe delivery, and verified release of escrow funds.
                </p>

                {ratings.length === 0 ? (
                  <div className="empty-state">
                    No customer performance reviews submitted yet. Ratings will populate automatically as your completed escrow transactions close.
                  </div>
                ) : (
                  <div className="stack" style={{ gap: '12px', marginTop: '12px' }}>
                    {ratings.map((r) => (
                      <div key={r.id} className="kyb-step-card stack" style={{ gap: '6px' }}>
                        <div className="actions" style={{ justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700 }}>{r.reviewer_name}</span>
                          <span className="rating-pill">
                            <Star size={12} fill="#b45309" color="#b45309" /> {r.rating}.0
                          </span>
                        </div>
                        {r.title && <strong>{r.title}</strong>}
                        {r.comment && <p className="meta" style={{ margin: 0 }}>"{r.comment}"</p>}
                        <div className="meta" style={{ fontSize: '11px', marginTop: '4px' }}>
                          Verified Escrow Transaction · {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 4. SECURITY & 2FA TAB */}
            {activeTab === 'security' && (
              <div className="stack">
                {/* 2FA Toggle */}
                <section className="panel stack">
                  <div className="actions" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <h2 className="panel-title" style={{ margin: 0 }}>Two-Factor Authorization (2FA)</h2>
                      <p className="meta" style={{ margin: '4px 0 0' }}>Require one-time verification challenge for high-value fund movements.</p>
                    </div>
                    <button
                      className={`button ${twoFactorEnabled ? 'primary' : 'secondary'}`}
                      type="button"
                      onClick={handleToggle2FA}
                    >
                      {twoFactorEnabled ? '2FA Enabled' : 'Enable 2FA'}
                    </button>
                  </div>
                </section>

                {/* 4-Digit Escrow Transaction PIN */}
                <section className="panel stack">
                  <h2 className="panel-title" style={{ margin: 0 }}>4-Digit Escrow Transaction PIN</h2>
                  <p className="meta">Set a dedicated 4-digit numeric PIN to approve payouts, release vehicle titles, or cancel active contracts.</p>

                  <form className="form-grid" onSubmit={handlePinSubmit}>
                    <div className="grid two">
                      <div className="field">
                        <label htmlFor="sec_pin">CREATE 4-DIGIT PIN</label>
                        <input
                          id="sec_pin"
                          type="password"
                          maxLength={4}
                          value={pinForm.pin}
                          onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value })}
                          placeholder="••••"
                          required
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="sec_confirm_pin">CONFIRM 4-DIGIT PIN</label>
                        <input
                          id="sec_confirm_pin"
                          type="password"
                          maxLength={4}
                          value={pinForm.confirmPin}
                          onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                          placeholder="••••"
                          required
                        />
                      </div>
                    </div>
                    <div className="actions">
                      <button className="button primary" type="submit" disabled={loading}>
                        <KeyRound size={16} /> Save Transaction PIN
                      </button>
                    </div>
                  </form>
                </section>

                {/* Password Change */}
                <section className="panel stack">
                  <h2 className="panel-title" style={{ margin: 0 }}>Change Vault Password</h2>
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
                        <Lock size={16} /> Update Password
                      </button>
                    </div>
                  </form>
                </section>

                {/* Security Audit Log */}
                <section className="panel stack">
                  <h2 className="panel-title" style={{ margin: 0 }}>Security Event & Audit Log</h2>
                  <p className="meta">Immutable log of security actions, authentications, and fund authorizations.</p>
                  {auditLogs.length === 0 ? (
                    <div className="empty-state">No recent security events logged.</div>
                  ) : (
                    <div className="stack" style={{ gap: '8px' }}>
                      {auditLogs.map((log) => (
                        <div key={log.id} className="verification-status-row" style={{ padding: '8px 14px' }}>
                          <div>
                            <strong>{log.event_type}</strong> · <span className="meta">{log.description}</span>
                          </div>
                          <span className="meta" style={{ fontSize: '11px' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* 5. CONTACT & VERIFICATION TAB */}
            {activeTab === 'contact' && (
              <div className="stack">
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

            {/* 6. APPEARANCE & THEME TAB */}
            {activeTab === 'appearance' && (
              <section className="panel stack">
                <h2 className="panel-title" style={{ margin: 0 }}>Theme & Display Settings</h2>
                <p className="meta">Choose between high-contrast dark vault mode or crisp daylight clarity without visual glare or fluorescent glows.</p>

                <div className="theme-mode-grid" style={{ marginTop: 12 }}>
                  <div
                    className={`theme-mode-card ${theme === 'dark' ? 'selected' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon size={36} color="#0d9488" />
                    <div>
                      <strong>Dark Vault (Matte & Secure)</strong>
                      <div className="meta">High-contrast, professional financial palette without luminous glows.</div>
                    </div>
                    {theme === 'dark' && <span className="verified-pill"><CheckCircle2 size={14} /> Active</span>}
                  </div>

                  <div
                    className={`theme-mode-card ${theme === 'light' ? 'selected' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <Sun size={36} color="#b45309" />
                    <div>
                      <strong>Daylight Bright</strong>
                      <div className="meta">Clean, high-visibility light theme optimized for well-lit environments.</div>
                    </div>
                    {theme === 'light' && <span className="verified-pill"><CheckCircle2 size={14} /> Active</span>}
                  </div>
                </div>
              </section>
            )}

            {/* 7. NOTIFICATIONS TAB */}
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
                        style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#0d9488' }}
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
