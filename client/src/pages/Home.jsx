import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  Upload as UploadIcon, 
  FolderOpen, 
  Settings, 
  BarChart3,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  FileText,
  Image,
  Brain,
  Stethoscope,
  LogOut,
  User
} from 'lucide-react';

// Header component for homepage
function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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
          onClick={() => navigate('/projects')}
          style={{ 
            textDecoration: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Projects
        </button>
        <button
          onClick={() => navigate('/upload')}
          style={{ 
            textDecoration: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Upload
        </button>
        <button
          onClick={() => navigate('/home')}
          style={{
            cursor: "pointer",
            fontSize: "16px",
            color: "#0066cc",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1)";
          }}
        >
          Home
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            cursor: "pointer",
            fontSize: "16px",
            color: "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = "#004c99";
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

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: UploadIcon,
      title: "آپلود آسان",
      description: "تصاویر پزشکی خود را به راحتی آپلود کنید",
      color: "#3B82F6"
    },
    {
      icon: Brain,
      title: "آنوتاسیون هوشمند",
      description: "ابزارهای پیشرفته برای آنوتاسیون تصاویر پزشکی",
      color: "#8B5CF6"
    },
    {
      icon: BarChart3,
      title: "تحلیل داده",
      description: "تحلیل و گزارش‌گیری از پروژه‌های شما",
      color: "#10B981"
    },
    {
      icon: Shield,
      title: "امنیت بالا",
      description: "اطلاعات شما با بالاترین سطح امنیت محافظت می‌شود",
      color: "#F59E0B"
    }
  ];

  const quickActions = isAuthenticated ? [
    {
      title: "پروژه جدید",
      description: "ایجاد پروژه آنوتاسیون جدید",
      icon: FolderOpen,
      color: "#3B82F6",
      onClick: () => navigate('/projects')
    },
    {
      title: "آپلود فایل",
      description: "آپلود تصاویر پزشکی",
      icon: UploadIcon,
      color: "#10B981",
      onClick: () => navigate('/upload')
    },
    {
      title: "مدیریت پروژه‌ها",
      description: "مشاهده و مدیریت پروژه‌های موجود",
      icon: Settings,
      color: "#8B5CF6",
      onClick: () => navigate('/projects')
    },
    {
      title: "آنوتاسیون",
      description: "شروع کار با ابزارهای آنوتاسیون",
      icon: Stethoscope,
      color: "#F59E0B",
      onClick: () => navigate('/')
    }
  ] : [
    {
      title: "ورود",
      description: "وارد حساب کاربری خود شوید",
      icon: User,
      color: "#3B82F6",
      onClick: () => navigate('/login')
    },
    {
      title: "ثبت‌نام",
      description: "حساب کاربری جدید ایجاد کنید",
      icon: User,
      color: "#10B981",
      onClick: () => navigate('/signup')
    },
    {
      title: "درباره ما",
      description: "اطلاعات بیشتر درباره پلتفرم",
      icon: FileText,
      color: "#8B5CF6",
      onClick: () => navigate('/home')
    },
    {
      title: "تماس با ما",
      description: "راه‌های ارتباط با تیم پشتیبانی",
      icon: Users,
      color: "#F59E0B",
      onClick: () => navigate('/home')
    }
  ];

  // Show different content based on authentication status
  const welcomeMessage = isAuthenticated 
    ? `خوش آمدید ${user?.name || user?.email}! به پلتفرم پیشرفته آنوتاسیون تصاویر پزشکی خوش آمدید.`
    : "به پلتفرم پیشرفته آنوتاسیون تصاویر پزشکی خوش آمدید.";

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      
      {/* Hero Section */}
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            margin: '0 0 20px 0',
            background: 'linear-gradient(45deg, #ffffff, #e0f2fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            پلتفرم آنوتاسیون تصاویر پزشکی
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            margin: '0 0 40px 0',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            {welcomeMessage}
            <br />
            ابزارهای قدرتمند برای تحلیل و آنوتاسیون تصاویر پزشکی در دسترس شماست.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/upload')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    backgroundColor: '#ffffff',
                    color: '#1e40af',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                  }}
                >
                  <UploadIcon size={24} />
                  شروع آپلود
                  <ArrowRight size={20} />
                </button>
                
                <button
                  onClick={() => navigate('/projects')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.color = '#1e40af';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <FolderOpen size={24} />
                  مشاهده پروژه‌ها
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    backgroundColor: '#ffffff',
                    color: '#1e40af',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                  }}
                >
                  <User size={24} />
                  ورود
                  <ArrowRight size={20} />
                </button>
                
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.color = '#1e40af';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <User size={24} />
                  ثبت‌نام
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        padding: '80px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 20px 0'
          }}>
            ویژگی‌های کلیدی
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            ابزارهای پیشرفته و امکانات کامل برای آنوتاسیون و تحلیل تصاویر پزشکی
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                padding: '40px 30px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: '1px solid #f1f5f9'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-8px)';
                e.target.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: `${feature.color}20`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto'
              }}>
                <feature.icon size={40} color={feature.color} />
              </div>
              
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 16px 0'
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                lineHeight: '1.6',
                margin: 0
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div style={{
        padding: '80px 20px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 20px 0'
          }}>
            شروع سریع
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            margin: '0 0 60px 0'
          }}>
            انتخاب کنید که از کجا می‌خواهید شروع کنید
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                style={{
                  padding: '30px 24px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = action.color;
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: `${action.color}20`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <action.icon size={28} color={action.color} />
                </div>
                
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    {action.title}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '40px 20px',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          opacity: 0.8
        }}>
          © 2024 Medical Image Annotation Platform. تمام حقوق محفوظ است.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
