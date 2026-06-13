import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, RefreshCw, Check, Zap } from 'lucide-react';
import { api } from '../utils/api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [form, setForm] = useState({ login_id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState('idle');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.login_id || !form.password) {
      setErrorMsg('Please enter your Login ID and password.');
      return;
    }
    setErrorMsg('');
    setSubmitState('validating');
    
    try {
      const result = await api.post('/auth/login', {
        email: form.login_id,
        password: form.password,
      });
      localStorage.setItem('auth_data', JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      }));

      setSubmitState('granted');
      await new Promise(r => setTimeout(r, 800));
      navigate('/dashboard');
    } catch (err) {
      setSubmitState('error');
      setErrorMsg(err.message || 'Invalid Login ID or password.');
      setTimeout(() => setSubmitState('idle'), 2000);
    }
  };

  const cardStyle = {
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: tilt.x === 0 ? 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
  };

  return (
    <div className="login-page" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {}
      <div className="login-blob login-blob--tl" />
      <div className="login-blob login-blob--br" />
      <div className="login-blob login-blob--tr" />

      {}
      <div className="login-card" ref={cardRef} style={cardStyle}>
        {}
        <div className="login-card-header">
          <div className="login-logo-mark">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="login-title">Nexus ERP</h1>
            <p className="login-subtitle">Sign in to your workspace</p>
          </div>
        </div>

        {}
        <div className="login-divider" />

        {}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {}
          <div className="login-field">
            <label className="login-label" htmlFor="login-id">Login ID (Email)</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon login-input-icon--left" strokeWidth={1.75} />
              <input
                id="login-id"
                type="text"
                className="login-input"
                placeholder="you@company.com"
                value={form.login_id}
                onChange={e => setForm(f => ({ ...f, login_id: e.target.value }))}
                autoComplete="username"
              />
            </div>
          </div>

          {}
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

          {}
          {errorMsg && (
            <p className="login-error">{errorMsg}</p>
          )}

          {}
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
            {submitState === 'error' && (
              <>
                Failed
              </>
            )}
          </button>
        </form>

        {}
        <p className="login-footer-text">
          Need access?{' '}
          <span 
            className="login-footer-link" 
            style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
            onClick={() => navigate('/register')}
          >
            Request an Account (Sign Up)
          </span>
        </p>
      </div>
    </div>
  );
}

