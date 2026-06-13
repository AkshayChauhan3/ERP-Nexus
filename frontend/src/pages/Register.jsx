import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Eye, EyeOff, RefreshCw, Check, Zap, ArrowLeft } from 'lucide-react';
import { api } from '../utils/api';
import './Register.css';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales User' },
  { value: 'purchase', label: 'Purchase User' },
  { value: 'manufacturing', label: 'Manufacturing User' },
  { value: 'inventory', label: 'Inventory Manager' },
  { value: 'owner', label: 'Business Owner' },
];

export default function Register() {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // idle | registering | success | error
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  /* ── Parallax tilt ── */
  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * 5, y: dx * -5 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setErrorMsg('');
    setSubmitState('registering');
    
    try {
      await api.post('/auth/register-public', form);
      
      setSubmitState('success');
      // Show success screen then redirect to login
      await new Promise(r => setTimeout(r, 2500));
      navigate('/login');
    } catch (err) {
      setSubmitState('error');
      setErrorMsg(err.message || 'Registration failed. Please try again.');
      setTimeout(() => setSubmitState('idle'), 2000);
    }
  };

  const cardStyle = {
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: tilt.x === 0 ? 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
  };

  return (
    <div className="register-page" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Ambient blobs */}
      <div className="register-blob register-blob--tl" />
      <div className="register-blob register-blob--br" />
      <div className="register-blob register-blob--tr" />

      {/* Card */}
      <div className="register-card" ref={cardRef} style={cardStyle}>
        {/* Back button */}
        <button className="register-back-btn" onClick={() => navigate('/login')}>
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        {/* Header */}
        <div className="register-card-header">
          <div className="register-logo-mark">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="register-title">Request Access</h1>
            <p className="register-subtitle">Submit a request to join ERP Nexus</p>
          </div>
        </div>

        {/* Divider */}
        <div className="register-divider" />

        {/* Success State */}
        {submitState === 'success' ? (
          <div className="register-success-pane animate-fade-in">
            <div className="register-success-icon-wrapper">
              <Check size={36} strokeWidth={3} />
            </div>
            <h2 className="register-success-title">Request Submitted!</h2>
            <p className="register-success-desc">
              Your registration request has been sent to the system administrator.
              You will be able to sign in once your account is approved.
            </p>
            <p className="register-success-redirect">Redirecting to login page...</p>
          </div>
        ) : (
          /* Form */
          <form className="register-form" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="register-field">
              <label className="register-label" htmlFor="register-name">Full Name</label>
              <div className="register-input-wrapper">
                <User size={16} className="register-input-icon register-input-icon--left" strokeWidth={1.75} />
                <input
                  id="register-name"
                  type="text"
                  className="register-input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="register-field">
              <label className="register-label" htmlFor="register-email">Email Address</label>
              <div className="register-input-wrapper">
                <Mail size={16} className="register-input-icon register-input-icon--left" strokeWidth={1.75} />
                <input
                  id="register-email"
                  type="email"
                  className="register-input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="register-field">
              <label className="register-label" htmlFor="register-password">Password</label>
              <div className="register-input-wrapper">
                <Lock size={16} className="register-input-icon register-input-icon--left" strokeWidth={1.75} />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="register-input register-input--padded-r"
                  placeholder="•••••••• (min 6 chars)"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="register-input-icon register-input-icon--right register-eye-btn"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff size={16} strokeWidth={1.75} />
                    : <Eye size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* Role Select */}
            <div className="register-field">
              <label className="register-label" htmlFor="register-role">Requested Access Role</label>
              <div className="register-input-wrapper">
                <Briefcase size={16} className="register-input-icon register-input-icon--left" strokeWidth={1.75} />
                <select
                  id="register-role"
                  className="register-input register-select"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="">Select your target role…</option>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="register-error">{errorMsg}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="register-submit-btn"
              className="register-btn"
              disabled={submitState !== 'idle' && submitState !== 'error'}
            >
              {submitState === 'idle' && 'Submit Request'}
              {submitState === 'registering' && (
                <>
                  <RefreshCw size={16} className="spin" />
                  Submitting…
                </>
              )}
              {submitState === 'error' && 'Failed'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
