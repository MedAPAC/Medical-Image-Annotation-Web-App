import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import { User, Shield, Lock } from 'lucide-react';
import '../styles/Login.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <Header page="login" />

      <main className="login-main">
        <form onSubmit={onSubmit} className="login-form">
          {/* Header */}
          <div className="login-header">
            <div className="login-icon-container">
              <User size={28} />
            </div>
            <h1 className="login-title">Medical Professional Login</h1>
            <p className="login-subtitle">
              Access your secure medical imaging workspace
            </p>
          </div>

          {/* Email Field */}
          <div className="login-form-group">
            <label className="login-label">
              Professional Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="you@hospital.org"
              className="login-input"
            />
          </div>

          {/* Password Field */}
          <div className="login-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="login-label">
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
              className="login-input"
            />
          </div>

          {/* Medical Access Note */}
          {/* <div className="medical-access-note">
            <p>
              <Lock size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              <strong>Secure Access:</strong> This portal is for authorized medical professionals only
            </p>
          </div> */}

          {/* Error Message */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="login-submit-button"
          >
            {loading ? 'Authenticating...' : 'Access Medical Workspace'}
          </button>

          {/* Footer Link */}
          <div className="login-footer">
            Don't have a medical account?{' '}
            <Link to="/signup" className="login-link">
              Sign Up
            </Link>
          </div>

          {/* HIPAA Compliance Note */}
          {/* <div style={{ 
            textAlign: 'center', 
            marginTop: '20px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.1)'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Shield size={12} color="#3b82f6" />
              <span>HIPAA Compliant • End-to-End Encrypted • Secure Authentication</span>
            </p>
          </div> */}
        </form>
      </main>
    </div>
  );
};

export default LoginPage;