import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { LogOut, Home, FolderKanban, ListChecks, Users, Activity } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { LANGUAGE_OPTIONS } from '../i18n/uiText';
import '../styles/Header.css';

function Header({ page, guardedNavigate }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation('header');
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const currentPage = page || location.pathname.split('/')[1];
  const activeLanguageCode = (i18n.language || 'en').split('-')[0];
  const activeLanguage = LANGUAGE_OPTIONS.find((language) => language.code === activeLanguageCode)
    || LANGUAGE_OPTIONS[0];

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    axios.defaults.headers.common['Accept-Language'] = lng;
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
  };

  const handleLogout = () => {
    const runLogout = () => {
      logout();
      navigate('/');
    };
    if (guardedNavigate) guardedNavigate(runLogout);
    else runLogout();
  };

  const goTo = (path) => {
    if (guardedNavigate) guardedNavigate(() => navigate(path));
    else navigate(path);
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

  const handleUserInfoClick = () => {
    setIsProfileModalOpen(true);
  };

  return (
    <header className="header-container" role="banner">
      {/* Language Selector */}
      <div className="language-control">
        <span className="language-flag" aria-hidden="true">
          {activeLanguage.flag}
        </span>
        <select
          aria-label="Select interface language"
          onChange={(e) => changeLang(e.target.value)}
          value={activeLanguageCode}
          className="language-selector"
        >
          {LANGUAGE_OPTIONS.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.label}
            </option>
          ))}
        </select>
      </div>

      {/* Brand Name - MediAnnotate */}
      <div 
        onClick={() => goTo('/')}
        className="brand-name"
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') goTo('/');
        }}
      >
        <span className="brand-mark" aria-hidden="true">
          <Activity size={18} />
        </span>
        <span className="brand-copy">
          <span className="brand-title">MediAnnotate</span>
          <span className="brand-subtitle">{t('header.brand_subtitle')}</span>
        </span>
      </div>

      {/* Navigation (ONLY when logged in) */}
      {isAuthenticated && (
        <nav className="header-nav" aria-label="Primary navigation">
          <button
            onClick={() => goTo('/home')}
            className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
          >
            <Home size={16} style={{ marginRight: '6px' }} />
            {t('header.home')}
          </button>
          <button
            onClick={() => goTo('/teams')}
            className={`nav-button ${currentPage === 'teams' ? 'active' : ''}`}
          >
            <Users size={16} style={{ marginRight: '6px' }} />
            {t('header.teams')}
          </button>
          <button
            onClick={() => goTo('/projects')}
            className={`nav-button ${currentPage === 'projects' ? 'active' : ''}`}
          >
            <FolderKanban size={16} style={{ marginRight: '6px' }} />
            {t('header.projects')}
          </button>

          <button
            onClick={() => goTo('/tasks')}
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
            <div 
              className="user-info" 
              onClick={handleUserInfoClick}
              style={{ cursor: 'pointer' }}
            >
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
              onClick={() => goTo('/login')}
              className="auth-button login-button"
            >
              {t('header.login')}
            </button>

            {/* Signup Button */}
            <button
              onClick={() => goTo('/signup')}
              className="auth-button signup-button"
            >
              {t('header.signup')}
            </button>
          </>
        )}
      </div>

      {/* User Profile Modal */}
      {isAuthenticated && (
        <UserProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
        />
      )}
    </header>
  );
}

export default Header;
