import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Header from '../components/Header';
import { 
  User
} from 'lucide-react';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setLoading(false);
      return;
    }

    const result = await signup(name, email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header page="signup" />
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <form 
        onSubmit={onSubmit} 
        style={{ 
          maxWidth: 420, 
          width: '100%', 
          backgroundColor: '#fff', 
          padding: 32, 
          borderRadius: 12, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
          display: 'grid', 
          gap: 16,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif'
        }}
      >
        <h2 style={{ 
          margin: 0, 
          fontSize: 24, 
          fontWeight: 700, 
          color: '#1d4ed8', 
          textAlign: 'center' 
        }}>Sign up</h2>
        
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Name
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required
            disabled={loading}
            style={{ 
              marginTop: 4, 
              width: '100%', 
              padding: 10, 
              borderRadius: 6, 
              border: '1px solid #d1d5db',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              opacity: loading ? 0.6 : 1
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </label>
        
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Email
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            disabled={loading}
            style={{ 
              marginTop: 4, 
              width: '100%', 
              padding: 10, 
              borderRadius: 6, 
              border: '1px solid #d1d5db',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              opacity: loading ? 0.6 : 1
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </label>
        
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Password (min 6 characters)
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            disabled={loading}
            style={{ 
              marginTop: 4, 
              width: '100%', 
              padding: 10, 
              borderRadius: 6, 
              border: '1px solid #d1d5db',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              opacity: loading ? 0.6 : 1
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </label>
        
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Confirm Password
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            required 
            disabled={loading}
            style={{ 
              marginTop: 4, 
              width: '100%', 
              padding: 10, 
              borderRadius: 6, 
              border: confirmPassword && password !== confirmPassword ? '1px solid #dc2626' : confirmPassword && password === confirmPassword ? '1px solid #10b981' : '1px solid #d1d5db',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              opacity: loading ? 0.6 : 1
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = confirmPassword && password !== confirmPassword ? '#dc2626' : confirmPassword && password === confirmPassword ? '#10b981' : '#d1d5db'}
          />
          {confirmPassword && password !== confirmPassword && (
            <p style={{ 
              color: '#dc2626', 
              fontSize: '12px', 
              margin: '4px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ✗ Passwords do not match
            </p>
          )}
          {confirmPassword && password === confirmPassword && password.length >= 6 && (
            <p style={{ 
              color: '#10b981', 
              fontSize: '12px', 
              margin: '4px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ✓ Passwords match
            </p>
          )}
        </label>
        
        <button 
          type="submit" 
          disabled={loading || (confirmPassword && password !== confirmPassword)}
          style={{ 
            padding: 10, 
            background: loading || (confirmPassword && password !== confirmPassword) ? '#9ca3af' : 'linear-gradient(90deg, #2563eb, #3b82f6)', 
            color: 'white', 
            borderRadius: 6, 
            fontWeight: 600, 
            border: 'none', 
            cursor: loading || (confirmPassword && password !== confirmPassword) ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => !loading && !(confirmPassword && password !== confirmPassword) && (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={(e) => !loading && !(confirmPassword && password !== confirmPassword) && (e.currentTarget.style.opacity = '1')}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        
        {error && (
          <p style={{ 
            color: '#dc2626', 
            background: '#fee2e2', 
            padding: 8, 
            borderRadius: 6,
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </p>
        )}
        
        <p style={{ fontSize: 14, textAlign: 'center', color: '#374151' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
            Login
          </Link>
        </p>
      </form>
      </div>
    </div>
  );
}

export default SignupPage;
