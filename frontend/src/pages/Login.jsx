import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Briefcase, Eye, EyeOff, RefreshCw, Check, Zap } from 'lucide-react';
import './Login.css';

const ROLES = [
  'Operations Manager',
  'Sales Executive',
  'Warehouse Supervisor',
  'Production Lead',
  'Logistics Coordinator',
  'Finance Analyst',
  'Administrator',
];

export default function Login() {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [form, setForm] = useState({ email: '', password: '', role: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // idle | validating | granted | error
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
    if (!form.email || !form.password || !form.role) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setErrorMsg('');
    setSubmitState('validating');
    await new Promise(r => setTimeout(r, 1400));
    setSubmitState('granted');
    await new Promise(r => setTimeout(r, 800));
    navigate('/dashboard');
  };

  const cardStyle = {
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: tilt.x === 0 ? 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
  };

  return (
    <div className="login-page" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Ambient blobs */}
      <div className="login-blob login-blob--tl" />
      <div className="login-blob login-blob--br" />
      <div className="login-blob login-blob--tr" />

      {/* Card */}
      <div className="login-card" ref={cardRef} style={cardStyle}>
        {/* Header */}
        <div className="login-card-header">
          <div className="login-logo-mark">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="login-title">Nexus ERP</h1>
            <p className="login-subtitle">Sign in to your workspace</p>
          </div>
        </div>

        {/* Divider */}
        <div className="login-divider" />

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="login-field">
            <label className="login-label" htmlFor="login-email">Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon login-input-icon--left" strokeWidth={1.75} />
              <input
                id="login-email"
                type="email"
                className="login-input"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label" htmlFor="login-password">Password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon login-input-icon--left" strokeWidth={1.75} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-input login-input--padded-r"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-input-icon login-input-icon--right login-eye-btn"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff size={16} strokeWidth={1.75} />
                  : <Eye size={16} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div className="login-field">
            <label className="login-label" htmlFor="login-role">Access Role</label>
            <div className="login-input-wrapper">
              <Briefcase size={16} className="login-input-icon login-input-icon--left" strokeWidth={1.75} />
              <select
                id="login-role"
                className="login-input login-select"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="">Select your role…</option>
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <p className="login-error">{errorMsg}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="login-submit-btn"
            className={`login-btn ${submitState === 'granted' ? 'login-btn--granted' : ''}`}
            disabled={submitState !== 'idle' && submitState !== 'error'}
          >
            {submitState === 'idle' && 'Sign In to Nexus'}
            {submitState === 'validating' && (
              <>
                <RefreshCw size={16} className="spin" />
                Validating…
              </>
            )}
            {submitState === 'granted' && (
              <>
                <Check size={16} />
                Access Granted
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="login-footer-text">
          Need access? Contact your{' '}
          <a href="#" className="login-footer-link">System Administrator</a>
        </p>
      </div>
    </div>
  );
}
