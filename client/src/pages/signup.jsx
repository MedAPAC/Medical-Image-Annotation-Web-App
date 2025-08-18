import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    
    try {
      const { data } = await axios.post('/api/auth/signup', { email, password, name });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      navigate('/login');
      
    } catch (err) {
      setError(err?.response?.data?.error || 'Signup Failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #dbeafe, #eff6ff)' }}>
      <form onSubmit={onSubmit} style={{ maxWidth: 420, width: '100%', backgroundColor: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'grid', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1d4ed8', textAlign: 'center' }}>Sign up</h2>
        <label>Name
          <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 4, width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </label>
        <label>Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ marginTop: 4, width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </label>
        <label>Password (min 6)
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ marginTop: 4, width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </label>
        <button type="submit" style={{ padding: 10, background: 'linear-gradient(90deg, #2563eb, #3b82f6)', color: 'white', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Create account</button>
        {error && <p style={{ color: '#dc2626', background: '#fee2e2', padding: 8, borderRadius: 6 }}>{error}</p>}
        <p style={{ fontSize: 14, textAlign: 'center' }}>Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: 500 }}>Login</Link></p>
      </form>
    </div>
  );
}
