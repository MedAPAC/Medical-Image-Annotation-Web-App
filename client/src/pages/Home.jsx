import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import '../styles/Home.css';

import { 
  Upload as UploadIcon, 
  FolderOpen, 
  Settings, 
  BarChart3,
  Users,
  Shield,
  ArrowRight,
  FileText,
  Brain,
  Stethoscope,
  User,
  Heart,
  Crosshair,
  Zap,
  Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import bg from '../icons/gif.gif';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("home");

  useEffect(() => {
    document.documentElement.setAttribute("dir", i18n.dir());
  }, [i18n.language]);

  const features = [
    {
      icon: UploadIcon,
      title: t("home.feature_upload_title"),
      description: t("home.feature_upload_desc"),
      color: "#4299e1"
    },
    {
      icon: Crosshair,
      title: "Precise Annotation",
      description: "Advanced tools for accurate medical image markup with AI-assisted precision",
      color: "#48bb78"
    },
    {
      icon: BarChart3,
      title: t("home.feature_analysis_title"),
      description: t("home.feature_analysis_desc"),
      color: "#ed8936"
    },
    {
      icon: Shield,
      title: t("home.feature_security_title"),
      description: t("home.feature_security_desc"),
      color: "#9f7aea"
    },
    {
      icon: Activity,
      title: "Real-time Collaboration",
      description: "Work together with medical teams in real-time on complex cases",
      color: "#f56565"
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Leverage machine learning for automated detection and analysis",
      color: "#38b2ac"
    }
  ];

  const quickActions = isAuthenticated ? [
    {
      title: "Start New Project",
      description: "Create a new medical imaging project with advanced settings",
      icon: FolderOpen,
      color: "#4299e1",
      onClick: () => navigate('/projects')
    },
    {
      title: "Upload Medical Images",
      description: "Upload DICOM, NIfTI, and other medical imaging formats",
      icon: UploadIcon,
      color: "#48bb78",
      onClick: () => navigate('/upload')
    },
    {
      title: "Manage Annotations",
      description: "Review and manage all your medical image annotations",
      icon: Crosshair,
      color: "#ed8936",
      onClick: () => navigate('/annotations')
    },
    {
      title: "Team Collaboration",
      description: "Invite team members and collaborate in real-time",
      icon: Users,
      color: "#9f7aea",
      onClick: () => navigate('/team')
    },
    {
      title: "View Analytics",
      description: "Access detailed analytics and reporting tools",
      icon: BarChart3,
      color: "#f56565",
      onClick: () => navigate('/analytics')
    },
    {
      title: "Settings & Preferences",
      description: "Configure your workspace and annotation preferences",
      icon: Settings,
      color: "#38b2ac",
      onClick: () => navigate('/settings')
    }
  ] : [
    {
      title: "Medical Professional Login",
      description: "Access your secure medical imaging workspace",
      icon: Stethoscope,
      color: "#4299e1",
      onClick: () => navigate('/login')
    },
    {
      title: "Create Medical Account",
      description: "Register for healthcare professional access",
      icon: Heart,
      color: "#48bb78",
      onClick: () => navigate('/signup')
    },
    {
      title: "View Demo",
      description: "Explore our medical annotation capabilities",
      icon: Crosshair,
      color: "#ed8936",
      onClick: () => navigate('/demo')
    },
    {
      title: "Medical Use Cases",
      description: "Learn about clinical applications and case studies",
      icon: FileText,
      color: "#9f7aea",
      onClick: () => navigate('/use-cases')
    },
    {
      title: "HIPAA Compliance",
      description: "Review our security and compliance standards",
      icon: Shield,
      color: "#f56565",
      onClick: () => navigate('/compliance')
    },
    {
      title: "Contact Support",
      description: "Get assistance from our medical support team",
      icon: Users,
      color: "#38b2ac",
      onClick: () => navigate('/contact')
    }
  ];

  const welcomeMessage = isAuthenticated
    ? t("home.welcome_user", { name: user?.name || user?.email })
    : "Welcome to the future of medical imaging annotation";

  return (
    <div className="home-container">
      <Header page="home" />
      
      {/* Medical Badge */}
      <div className="medical-badge">
        <Shield size={14} />
        HIPAA Compliant & Secure
      </div>
      
      {/* Hero Section */}
      <div 
        className="hero-section"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Medical Imaging Annotation Platform</h1>
          <p className="hero-subtitle">
            {welcomeMessage}
            <br />
            Advanced tools for medical professionals to annotate, analyze, and collaborate on medical images with precision and security.
          </p>
          
          <div className="hero-buttons">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/upload')}
                  className="hero-button hero-button-primary"
                >
                  <UploadIcon size={22} />
                  Upload Medical Images
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/projects')}
                  className="hero-button hero-button-secondary"
                >
                  <FolderOpen size={22} />
                  View Active Projects
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="hero-button hero-button-primary"
                >
                  <Stethoscope size={22} />
                  Medical Professional Login
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="hero-button hero-button-secondary"
                >
                  <Heart size={22} />
                  Request Demo Access
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="section-header">
          <h2 className="section-title">Clinical-Grade Annotation Tools</h2>
          <p className="section-description">
            Built by medical professionals for medical professionals. Our platform combines precision annotation tools with AI-powered insights for superior diagnostic support.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{ "--feature-color": feature.color }}
            >
              <div className="feature-icon-container">
                <feature.icon size={44} color={feature.color} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <div className="quick-actions-container">
          <div className="section-header">
            <h2 className="section-title">Medical Workflow</h2>
            <p className="section-description">
              Streamlined workflow designed for healthcare professionals. From image upload to clinical reporting, we've optimized every step.
            </p>
          </div>

          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="action-button"
                style={{ "--action-color": action.color }}
              >
                <div className="action-icon-container">
                  <action.icon size={30} color={action.color} />
                </div>
                <div className="action-content">
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-description">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="home-footer">
        <p className="footer-text">
          © {new Date().getFullYear()} Medical Imaging Annotation Platform. 
          This platform is designed for healthcare professionals and complies with HIPAA regulations. 
          For emergency medical assistance, please contact your local emergency services.
        </p>
      </div>
    </div>
  );
};

export default HomePage;