import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
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
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #dbeafe, #eff6ff)'
    }}>
      <form
        onSubmit={onSubmit}
        style={{
          maxWidth: 420,
          width: '100%',
          backgroundColor: '#ffffff',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'grid',
          gap: '16px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif'
        }}
      >
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: '#1d4ed8',
          textAlign: 'center'
        }}>Login</h2>

        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
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
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
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

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            background: loading ? '#9ca3af' : 'linear-gradient(90deg, #2563eb, #3b82f6)',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            borderRadius: '6px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.opacity = '1')}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {error && (
          <p style={{
            color: '#dc2626',
            background: '#fee2e2',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </p>
        )}

        <p style={{ fontSize: '14px', color: '#374151', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
