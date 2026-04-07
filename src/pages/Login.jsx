import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user) {
        navigate('/', { replace: true });
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Connection refused. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1"></div>
        <div className="aurora-blob aurora-blob-2"></div>
        <div className="aurora-blob aurora-blob-3"></div>
      </div>

      <div className="login-glass animate-in">
        {/* Logo */}
        <div className="login-logo" style={{ marginBottom: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="login-logo-icon" style={{ 
            background: 'var(--brand-primary)', 
            width: 48, height: 48, borderRadius: 12, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 20, fontWeight: 900,
            boxShadow: '0 0 30px var(--brand-primary-glow)',
            marginBottom: 16
          }}>EJ</div>
          <div className="login-logo-text">
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EarlyJobs CRM</h1>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Franchise Management System</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Email Address</label>
            <input
              className="glass-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@earlyjobs.ai"
              required
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="glass-input"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, color: '#ef4444', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', py: 14 }} disabled={loading}>
            {loading ? <Loader size={18} className="animate-spin" /> : null}
            <span style={{ fontWeight: 700 }}>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 32, letterSpacing: '0.02em' }}>
          &copy; 2026 EarlyJobs Franchise Pvt. Ltd. • Secure Access
        </p>
      </div>
    </div>
  );
}
