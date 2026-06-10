import React, { useState, useEffect } from 'react';
import { User, Mail, Edit2, Save, X, CheckCircle, AlertCircle, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../AuthContext';
import '../styles/UserProfileModal.css';

function UserProfileModal({ isOpen, onClose, user }) {
  const { updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ current: '', next: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setActiveTab('profile');
      setError('');
      setSuccessMsg('');
      setPasswordData({ current: '', next: '', confirm: '' });
      setShowPasswords({ current: false, next: false, confirm: false });
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMsg('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMsg('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ── Profile Save ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Unexpected server response. Check backend logs.');
      }

      const data = await response.json();

      if (!response.ok) {
        // 409 = duplicate email — surface the server message directly
        throw new Error(data.error || 'Failed to update profile.');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (updateUser && data.user) {
        updateUser(data.user);
      }

      setIsEditing(false);
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Password Save ─────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!passwordData.current) {
      setError('Current password is required.');
      return;
    }
    if (!passwordData.next) {
      setError('New password is required.');
      return;
    }
    if (passwordData.next.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (passwordData.next !== passwordData.confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (passwordData.current === passwordData.next) {
      setError('New password must be different from your current password.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.next,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Unexpected server response. Check backend logs.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setPasswordData({ current: '', next: '', confirm: '' });
      setSuccessMsg('Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '', email: user?.email || '' });
    setIsEditing(false);
    setError('');
    setSuccessMsg('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccessMsg('');
    setIsEditing(false);
  };

  const getInitials = () => {
    const n = formData.name || formData.email || '';
    return n
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

  if (!isOpen) return null;

  return (
    <div className="upm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="User Profile">
      <div className="upm-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="upm-header">
          <div className="upm-header-left">
            <Shield size={15} className="upm-header-icon" />
            <span className="upm-header-label">Account Profile</span>
          </div>
          <button className="upm-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Identity block */}
        <div className="upm-identity">
          <div className="upm-avatar">
            <span>{getInitials()}</span>
            <div className="upm-avatar-ring" />
          </div>
          <div className="upm-identity-text">
            <p className="upm-display-name">{formData.name || 'Unnamed User'}</p>
            <p className="upm-display-email">{formData.email || '—'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="upm-tabs">
          <button
            className={`upm-tab ${activeTab === 'profile' ? 'upm-tab--active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <User size={13} />
            Profile
          </button>
          <button
            className={`upm-tab ${activeTab === 'password' ? 'upm-tab--active' : ''}`}
            onClick={() => handleTabChange('password')}
          >
            <Lock size={13} />
            Password
          </button>
        </div>

        {/* Divider */}
        <div className="upm-divider" />

        {/* Body */}
        <div className="upm-body">

          {/* Feedback */}
          {error && (
            <div className="upm-feedback upm-feedback--error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="upm-feedback upm-feedback--success">
              <CheckCircle size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="upm-fields">
              <div className="upm-field">
                <label className="upm-label">
                  <User size={13} />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="upm-input"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                ) : (
                  <div className="upm-value">
                    {formData.name || <span className="upm-empty">Not set</span>}
                  </div>
                )}
              </div>

              <div className="upm-field">
                <label className="upm-label">
                  <Mail size={13} />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="upm-input"
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="upm-value">
                    {formData.email || <span className="upm-empty">Not set</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Password Tab ── */}
          {activeTab === 'password' && (
            <div className="upm-fields">
              <div className="upm-field">
                <label className="upm-label">
                  <Lock size={13} />
                  Current Password
                </label>
                <div className="upm-input-wrapper">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="current"
                    value={passwordData.current}
                    onChange={handlePasswordChange}
                    className="upm-input upm-input--with-icon"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="upm-eye-btn"
                    onClick={() => togglePasswordVisibility('current')}
                    aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.current ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="upm-field">
                <label className="upm-label">
                  <Lock size={13} />
                  New Password
                </label>
                <div className="upm-input-wrapper">
                  <input
                    type={showPasswords.next ? 'text' : 'password'}
                    name="next"
                    value={passwordData.next}
                    onChange={handlePasswordChange}
                    className="upm-input upm-input--with-icon"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="upm-eye-btn"
                    onClick={() => togglePasswordVisibility('next')}
                    aria-label={showPasswords.next ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.next ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="upm-field">
                <label className="upm-label">
                  <Lock size={13} />
                  Confirm New Password
                </label>
                <div className="upm-input-wrapper">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirm"
                    value={passwordData.confirm}
                    onChange={handlePasswordChange}
                    className="upm-input upm-input--with-icon"
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="upm-eye-btn"
                    onClick={() => togglePasswordVisibility('confirm')}
                    aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="upm-footer">
          {activeTab === 'profile' ? (
            isEditing ? (
              <>
                <button className="upm-btn upm-btn--ghost" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button className="upm-btn upm-btn--primary" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <><span className="upm-spinner" />Saving…</>
                  ) : (
                    <><Save size={14} />Save Changes</>
                  )}
                </button>
              </>
            ) : (
              <>
                <button className="upm-btn upm-btn--ghost" onClick={onClose}>
                  Close
                </button>
                <button
                  className="upm-btn upm-btn--primary"
                  onClick={() => { setSuccessMsg(''); setIsEditing(true); }}
                >
                  <Edit2 size={14} />
                  Edit Profile
                </button>
              </>
            )
          ) : (
            /* Password tab footer — always shows save */
            <>
              <button className="upm-btn upm-btn--ghost" onClick={onClose}>
                Close
              </button>
              <button className="upm-btn upm-btn--primary" onClick={handleSavePassword} disabled={isSaving}>
                {isSaving ? (
                  <><span className="upm-spinner" />Saving…</>
                ) : (
                  <><Save size={14} />Change Password</>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default UserProfileModal;