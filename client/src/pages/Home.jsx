import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import '../styles/Home.css';

import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Crosshair,
  FileText,
  FolderOpen,
  Heart,
  Shield,
  Stethoscope,
  Upload as UploadIcon,
  Users,
  Workflow
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import bg from '../icons/gif.gif';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('home');

  useEffect(() => {
    document.documentElement.setAttribute('dir', i18n.dir());
  }, [i18n]);

  const features = [
    {
      icon: UploadIcon,
      title: t('home.feature_upload_title'),
      description: t('home.feature_upload_desc'),
      color: '#2f80d0'
    },
    {
      icon: Crosshair,
      title: 'Precise Annotation',
      description: 'Polygon, polyline, point, and bounding workflows tuned for long medical review sessions.',
      color: '#15803d'
    },
    {
      icon: BarChart3,
      title: t('home.feature_analysis_title'),
      description: t('home.feature_analysis_desc'),
      color: '#b45309'
    },
    {
      icon: Shield,
      title: t('home.feature_security_title'),
      description: t('home.feature_security_desc'),
      color: '#1d4ed8'
    },
    {
      icon: Activity,
      title: 'Real-time Collaboration',
      description: 'Support radiologists, reviewers, and annotators working on the same case with clear task ownership.',
      color: '#c2410c'
    },
    {
      icon: Brain,
      title: 'AI-Ready Output',
      description: 'Prepare structured datasets and high-fidelity annotation exports for downstream model training.',
      color: '#0f766e'
    }
  ];

  const quickActions = isAuthenticated
    ? [
        {
          title: 'Start New Project',
          description: 'Create a project, define labels, and assign owners for a new imaging workflow.',
          icon: FolderOpen,
          color: '#2f80d0',
          onClick: () => navigate('/projects')
        },
        {
          title: 'Upload Medical Images',
          description: 'Bring in DICOM, NIfTI, and related datasets for review and annotation.',
          icon: UploadIcon,
          color: '#15803d',
          onClick: () => navigate('/upload')
        },
        {
          title: 'Manage Annotations',
          description: 'Open active work, review task progress, and continue labeling without losing context.',
          icon: Crosshair,
          color: '#b45309',
          onClick: () => navigate('/annotations')
        },
        {
          title: 'Team Collaboration',
          description: 'Manage contributors, reviewers, and multidisciplinary annotation teams.',
          icon: Users,
          color: '#1d4ed8',
          onClick: () => navigate('/team')
        },
        {
          title: 'View Analytics',
          description: 'Track throughput, project completion, and labeling consistency across workstreams.',
          icon: BarChart3,
          color: '#c2410c',
          onClick: () => navigate('/analytics')
        },
        {
          title: 'Settings & Preferences',
          description: 'Adjust workspace preferences and keep account settings aligned with your workflow.',
          icon: FileText,
          color: '#0f766e',
          onClick: () => navigate('/settings')
        }
      ]
    : [
        {
          title: 'Medical Professional Login',
          description: 'Access your secure medical imaging workspace.',
          icon: Stethoscope,
          color: '#2f80d0',
          onClick: () => navigate('/login')
        },
        {
          title: 'Create Medical Account',
          description: 'Register and prepare a workspace for clinical, research, or AI annotation operations.',
          icon: Heart,
          color: '#15803d',
          onClick: () => navigate('/signup')
        },
        {
          title: 'View Demo',
          description: 'Explore how projects, tasks, uploads, and annotation sessions fit together.',
          icon: Crosshair,
          color: '#b45309',
          onClick: () => navigate('/demo')
        },
        {
          title: 'Medical Use Cases',
          description: 'Review common radiology, pathology, and research annotation workflows.',
          icon: FileText,
          color: '#1d4ed8',
          onClick: () => navigate('/use-cases')
        },
        {
          title: 'HIPAA Compliance',
          description: 'Understand the security posture and operational safeguards around the platform.',
          icon: Shield,
          color: '#c2410c',
          onClick: () => navigate('/compliance')
        },
        {
          title: 'Contact Support',
          description: 'Reach the team when you need implementation or workflow guidance.',
          icon: Users,
          color: '#0f766e',
          onClick: () => navigate('/contact')
        }
      ];

  const heroStats = isAuthenticated
    ? [
        { label: 'Workspace', value: 'Live projects' },
        { label: 'Formats', value: 'DICOM + NIfTI' },
        { label: 'Mode', value: 'Team-based review' }
      ]
    : [
        { label: 'Deployment', value: 'Clinical-ready UI' },
        { label: 'Formats', value: 'DICOM + NIfTI' },
        { label: 'Output', value: 'Structured annotation data' }
      ];

  const workflowHighlights = isAuthenticated
    ? [
        {
          icon: Workflow,
          title: 'Structured project setup',
          copy: 'Define ownership, task boundaries, and annotation configuration before upload.'
        },
        {
          icon: Activity,
          title: 'Review-friendly operations',
          copy: 'Keep uploads, progress, and annotation work visible without forcing extra navigation.'
        },
        {
          icon: Shield,
          title: 'Clinical confidence',
          copy: 'Work in a calmer interface built for long sessions and high-accuracy review.'
        }
      ]
    : [
        {
          icon: Workflow,
          title: 'Operational workflow',
          copy: 'Move cleanly from ingestion to annotation to export without cobbling tools together.'
        },
        {
          icon: Users,
          title: 'Team-ready collaboration',
          copy: 'Support specialists, annotators, and project owners inside a single shared environment.'
        },
        {
          icon: Shield,
          title: 'Trustworthy presentation',
          copy: 'Give hospitals and research teams a workspace that feels stable and production-shaped.'
        }
      ];

  const welcomeMessage = isAuthenticated
    ? t('home.welcome_user', { name: user?.name || user?.email })
    : 'A production-ready workspace for medical imaging annotation, review, and dataset preparation.';

  return (
    <div className="home-container enterprise-page">
      <Header page="home" />

      <main className="home-main">
        <section className="hero-section" style={{ backgroundImage: `url(${bg})` }}>
          <div className="hero-overlay" />
          <div className="hero-shell">
            <div className="medical-badge">
              <Shield size={14} />
              HIPAA-minded workspace design
            </div>

            <div className="hero-grid">
              <div className="hero-copy">
                <p className="hero-eyebrow">Enterprise medical imaging platform</p>
                <h1 className="hero-title">Medical Imaging Annotation Platform</h1>
                <p className="hero-subtitle">
                  {welcomeMessage}
                  <span className="hero-subtitle-secondary">
                    Designed for hospitals, radiology labs, research teams, and AI data operations.
                  </span>
                </p>

                <div className="hero-buttons">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => navigate('/upload')}
                        className="hero-button hero-button-primary"
                      >
                        <UploadIcon size={20} />
                        Upload Medical Images
                        <ArrowRight size={16} />
                      </button>
                      <button
                        onClick={() => navigate('/projects')}
                        className="hero-button hero-button-secondary"
                      >
                        <FolderOpen size={20} />
                        View Active Projects
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/login')}
                        className="hero-button hero-button-primary"
                      >
                        <Stethoscope size={20} />
                        Medical Professional Login
                        <ArrowRight size={16} />
                      </button>
                      <button
                        onClick={() => navigate('/signup')}
                        className="hero-button hero-button-secondary"
                      >
                        <Heart size={20} />
                        Request Demo Access
                      </button>
                    </>
                  )}
                </div>

                <div className="hero-stats">
                  {heroStats.map((item) => (
                    <div key={item.label} className="hero-stat-card">
                      <span className="hero-stat-label">{item.label}</span>
                      <strong className="hero-stat-value">{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="hero-panel">
                <div className="hero-panel-card">
                  <div className="hero-panel-header">
                    <span className="hero-panel-kicker">Operational focus</span>
                    <h2 className="hero-panel-title">
                      {isAuthenticated ? 'What your workspace is optimized for' : 'Why teams adopt this workflow'}
                    </h2>
                  </div>

                  <div className="hero-panel-list">
                    {workflowHighlights.map((item) => (
                      <div key={item.title} className="hero-panel-item">
                        <div className="hero-panel-icon">
                          <item.icon size={18} />
                        </div>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.copy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="section-header">
            <p className="section-kicker">Core capabilities</p>
            <h2 className="section-title">Clinical-grade annotation tools</h2>
            <p className="section-description">
              A cleaner workspace for ingestion, labeling, review, and export. The platform keeps
              information density high without turning the interface into clutter.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="feature-card"
                style={{ '--feature-color': feature.color }}
              >
                <div className="feature-icon-container">
                  <feature.icon size={34} color={feature.color} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="quick-actions-section">
          <div className="quick-actions-container">
            <div className="section-header section-header-left">
              <p className="section-kicker">Next step</p>
              <h2 className="section-title">Practical entry points for real work</h2>
              <p className="section-description">
                Jump straight into the part of the workflow you need, whether that is project setup,
                image upload, collaboration, or downstream reporting.
              </p>
            </div>

            <div className="quick-actions-grid">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.onClick}
                  className="action-button"
                  style={{ '--action-color': action.color }}
                >
                  <div className="action-icon-container">
                    <action.icon size={26} color={action.color} />
                  </div>
                  <div className="action-content">
                    <div className="action-header">
                      <h3 className="action-title">{action.title}</h3>
                      <ArrowRight size={16} className="action-arrow" />
                    </div>
                    <p className="action-description">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-card">
            <div className="section-header section-header-left workflow-header">
              <p className="section-kicker">Platform posture</p>
              <h2 className="section-title">Built for sustained annotation sessions</h2>
              <p className="section-description">
                The interface is designed to support long-running clinical review and AI annotation work
                with clearer information hierarchy, calmer visual rhythm, and fewer dead ends.
              </p>
            </div>

            <div className="workflow-pill-row">
              <span className="workflow-pill">Upload and organize studies</span>
              <span className="workflow-pill">Annotate and review cases</span>
              <span className="workflow-pill">Coordinate teams and export data</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p className="footer-text">
          Copyright {new Date().getFullYear()} Medical Imaging Annotation Platform. This workspace
          is intended for healthcare, research, and AI dataset operations. For urgent medical care,
          contact local emergency services.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
