import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { LogOut, User } from 'lucide-react';

function Header({ page }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page from location
  const currentPage = page || location.pathname.split('/')[1];

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    axios.defaults.headers.common["Accept-Language"] = lng;
    document.documentElement.lang = lng; 
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#d0e7ff",
        padding: "10px 20px",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <div>
        <select
          onChange={(e) => changeLang(e.target.value)}
          defaultValue="en"
          style={{
            fontSize: "16px",
            padding: "6px",
            border: "1px solid #a0cfff",
            borderRadius: "4px",
            backgroundColor: "#f5faff",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#e1f0ff")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#f5faff")}
        >
          <option value="" disabled></option>
          <option value="en">🇬🇧 EN</option>
          <option value="fa">🇮🇷 فارسی</option>
          <option value="nl">🇳🇱 NL</option> 
        </select>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <button
          onClick={() => navigate('/home')}
          style={{
            cursor: "pointer",
            fontSize: "16px",
            color: currentPage === "home" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = currentPage === "home" ? "#0066cc" : "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Home
        </button>
        <button 
          onClick={() => navigate('/projects')}
          style={{ 
            textDecoration: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: currentPage === "projects" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = currentPage === "projects" ? "#0066cc" : "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Projects
        </button>
        <button
          onClick={() => navigate('/tasks')}
          style={{
            cursor: "pointer",
            fontSize: "16px",
            color: currentPage === "tasks" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = currentPage === "tasks" ? "#0066cc" : "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Tasks
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {isAuthenticated ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} />
              <span style={{ fontSize: "14px", color: "#004c99" }}>
                {user?.name || user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#b91c1c")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#dc2626")}
            >
              <LogOut size={14} />
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: "6px 12px",
                backgroundColor: "#a0d4ff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#87c8ff")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#a0d4ff")}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: "6px 12px",
                backgroundColor: "#007acc",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#005fa3")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#007acc")}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Header;

