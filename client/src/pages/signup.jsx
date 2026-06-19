import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import { UserPlus } from 'lucide-react';
import '../styles/SignUp.css';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signup } = useAuth();

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordValid = password.length >= 6;
  const isFormValid = passwordValid && passwordsMatch && name && email;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await signup(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="signup-container">
      <Header page="signup" />

      <main className="signup-main">
        <form onSubmit={onSubmit} className="signup-form">
          {/* Header */}
          <div className="signup-header">
            <div className="signup-icon-container">
              <UserPlus size={28} />
            </div>
            <h1 className="signup-title">Create Account</h1>
            <p className="signup-subtitle">
              Join our secure medical imaging annotation platform
            </p>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label className="form-label">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Dr. Jane Doe"
              className="form-input"
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">
              Professional Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="you@hospital.org"
              className="form-input"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
              className="form-input"
              style={{
                borderColor: password ? (passwordValid ? '#10b981' : '#ef4444') : '#e2e8f0'
              }}
            />
            <p className="password-hint">
              Minimum 6 characters required
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Confirm your password"
              className="form-input"
              style={{
                borderColor: confirmPassword ? (passwordsMatch ? '#10b981' : '#ef4444') : '#e2e8f0'
              }}
            />
            {confirmPassword && (
              <p className={`password-match ${passwordsMatch ? 'valid' : 'invalid'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Medical Professional Note */}
          {/* <div className="medical-note">
            <p>
              <Shield size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              <strong>HIPAA Compliant:</strong> Your medical data is secured with enterprise-grade encryption
            </p>
          </div> */}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="submit-button"
          >
            {loading ? 'Creating Account...' : 'Create Professional Account'}
          </button>

          {/* Footer Link */}
          <div className="signup-footer">
            Already have a medical account?{' '}
            <Link to="/login" className="signup-link">
              Sign in here
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SignupPage;
