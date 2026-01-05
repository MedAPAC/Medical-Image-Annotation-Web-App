import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { LogOut, User, Home, FolderKanban, ListChecks } from 'lucide-react';
import '../styles/Header.css';

function Header({ page }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation('header');
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = page || location.pathname.split('/')[1];

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    axios.defaults.headers.common['Accept-Language'] = lng;
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <header className="header-container">
      {/* Language Selector */}
      <select
        onChange={(e) => changeLang(e.target.value)}
        value={i18n.language}
        className="language-selector"
      >
        <option value="en">🇬🇧 English</option>
        <option value="fa">🇮🇷 فارسی</option>
        <option value="nl">🇳🇱 Nederlands</option>
      </select>

      {/* Brand Name - MediAnnotate */}
      <div 
        onClick={() => navigate('/')}
        className="brand-name"
        style={{ cursor: 'pointer' }}
      >
        MediAnnotate
      </div>

      {/* Navigation (ONLY when logged in) */}
      {isAuthenticated && (
        <nav className="header-nav">
          <button
            onClick={() => navigate('/home')}
            className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
          >
            <Home size={16} style={{ marginRight: '6px' }} />
            {t('header.home')}
          </button>

          <button
            onClick={() => navigate('/projects')}
            className={`nav-button ${currentPage === 'projects' ? 'active' : ''}`}
          >
            <FolderKanban size={16} style={{ marginRight: '6px' }} />
            {t('header.projects')}
          </button>

          <button
            onClick={() => navigate('/tasks')}
            className={`nav-button ${currentPage === 'tasks' ? 'active' : ''}`}
          >
            <ListChecks size={16} style={{ marginRight: '6px' }} />
            {t('header.tasks')}
          </button>
        </nav>
      )}

      {/* Auth Buttons */}
      <div className="auth-buttons">
        {isAuthenticated ? (
          <>
            <div className="user-info">
              <div className="user-avatar">
                {getUserInitials()}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {user?.name || user?.email?.split('@')[0]}
                </div>
                {user?.email && (
                  <div className="user-email">
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="auth-button logout-button"
            >
              <LogOut size={16} />
              <span>{t('header.logout')}</span>
            </button>
          </>
        ) : (
          <>
            {/* Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="auth-button login-button"
            >
              {t('header.login')}
            </button>

            {/* Signup Button */}
            <button
              onClick={() => navigate('/signup')}
              className="auth-button signup-button"
            >
              {t('header.signup')}
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;