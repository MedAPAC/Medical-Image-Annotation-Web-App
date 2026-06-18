import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import Header from '../components/Header';
import { 
  ArrowLeft,
  Edit3,
  Search,
  Plus,
  Check,
  X,
  Calendar,
  Users,
  Clock,
  FolderOpen,
  MessageSquare,
  Trash2,
  Eye,
  UserPlus,
  Download,
  Upload,
  Tag,
  FileText,
  AlertCircle,
  ChevronDown,
  Grid,
  List,
  BarChart3,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Cloud,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import '../styles/ProjectDetail.css';

const API_BASE_URL = 'http://localhost:5000';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token, loading: authLoading } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [issueTrackerMode, setIssueTrackerMode] = useState('raw');
  const [labels, setLabels] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [rawJsonContent, setRawJsonContent] = useState('{"labels":[],"attributes":[]}');
  const [owners, setOwners] = useState([]);
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedOwnerTeamIds, setSelectedOwnerTeamIds] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisableDriveConfirm, setShowDisableDriveConfirm] = useState(false);
  const [showRemoveOwnerConfirm, setShowRemoveOwnerConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [pageNotice, setPageNotice] = useState(null);
  const [driveStatus, setDriveStatus] = useState({
    configured: false,
    connected: false,
    email: ''
  });
  const [driveFolderInput, setDriveFolderInput] = useState('');
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveMessage, setDriveMessage] = useState('');
  const actionsMenuRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load tasks for this project
  const loadTasks = useCallback(async () => {
    if (!projectId || !token) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.tasks) {
        const tasksWithFormattedDates = response.data.tasks.map(task => ({
          ...task,
          id: task._id,
          createdAt: new Date(task.createdAt).toLocaleDateString(),
          updatedAt: new Date(task.updatedAt).toLocaleDateString(),
          assigneeName: task.assigneeDetails?.name || 'Unassigned',
          assigneeEmail: task.assigneeDetails?.email || '',
          filesCount: task.files?.length || 0,
          progress: task.progress || 0
        }));
        setTasks(tasksWithFormattedDates);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setTasks([]);
    }
  }, [projectId, token]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (authLoading || !isAuthenticated || !projectId || !token) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.project) {
          const projectData = response.data.project;
          setProject({
            id: projectData._id,
            name: projectData.name,
            description: projectData.description || '',
            labels: projectData.labels || [],
            attributes: projectData.attributes || [],
            createdAt: new Date(projectData.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            status: projectData.status || 'active',
            tasks: projectData.tasks || 0,
            progress: projectData.progress || 0,
            lastModified: new Date(projectData.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            createdBy: projectData.userId,
            owners: projectData.owners || [],
            ownerDetails: projectData.ownerDetails || [],
            driveBackup: projectData.driveBackup || null
          });
          
          setDescription(projectData.description || '');
          setLabels(projectData.labels || []);
          setAttributes(projectData.attributes || []);
          setRawJsonContent(JSON.stringify({
            labels: projectData.labels || [],
            attributes: projectData.attributes || []
          }, null, 2));
          setOwners(projectData.ownerDetails || []);
          setDriveFolderInput(projectData.driveBackup?.folderId || '');
          
          await loadTasks();
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error loading project:', err);
        if (err.response?.status === 404) {
          setError('Project not found');
          navigate('/projects');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          setError('You do not have permission to view this project');
          navigate('/projects');
        } else {
          setError('Error loading project. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && projectId && token) {
      loadProject();
    }
  }, [authLoading, isAuthenticated, projectId, token, navigate, loadTasks]);

  useEffect(() => {
    const loadTeams = async () => {
      if (authLoading || !isAuthenticated || !token) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/api/teams`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setTeams(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error loading teams:', err);
        setTeams([]);
      }
    };

    loadTeams();
  }, [authLoading, isAuthenticated, token]);

  useEffect(() => {
    const loadDriveStatus = async () => {
      if (authLoading || !isAuthenticated || !token) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/api/integrations/google-drive/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDriveStatus(response.data);
      } catch (err) {
        console.error('Error loading Google Drive status:', err);
        setDriveStatus({ configured: false, connected: false, email: '' });
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('googleDrive') === 'connected') {
      setDriveMessage('Google Drive connected. Enable backup for this project to start syncing.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('googleDrive') === 'error') {
      setDriveMessage(params.get('message') || 'Google Drive connection failed.');
      window.history.replaceState({}, '', window.location.pathname);
    }

    loadDriveStatus();
  }, [authLoading, isAuthenticated, token]);

  useEffect(() => {
    if (!showActionsMenu) return undefined;

    const handlePointerDown = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setShowActionsMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowActionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showActionsMenu]);

  // Listen for task updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      loadTasks();
    };

    window.addEventListener('taskUpdated', handleTaskUpdate);
    window.addEventListener('taskCreated', handleTaskUpdate);
    window.addEventListener('taskDeleted', handleTaskUpdate);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdate);
      window.removeEventListener('taskCreated', handleTaskUpdate);
      window.removeEventListener('taskDeleted', handleTaskUpdate);
    };
  }, [loadTasks]);

  const handleUpdateDescription = async () => {
    if (!project || !token) return;
    
    try {
      setPageNotice(null);
      await axios.put(`${API_BASE_URL}/api/projects/${projectId}`, {
        description: description
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setProject(prev => ({ ...prev, description }));
      setEditingDescription(false);
      setPageNotice({ type: 'success', text: 'Project description updated.' });
      
      // Update last modified
      setProject(prev => ({ 
        ...prev, 
        lastModified: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
    } catch (error) {
      console.error('Error updating description:', error);
      setPageNotice({ type: 'error', text: error.response?.data?.error || 'Failed to update description.' });
    }
  };

  const handleUpdateLabelsAndAttributes = async () => {
    if (!project || !token) return;
    
    try {
      setSaving(true);
      setPageNotice(null);
      const parsedData = JSON.parse(rawJsonContent);
      
      if (!Array.isArray(parsedData.labels) || !Array.isArray(parsedData.attributes)) {
        throw new Error('Invalid JSON structure. Must have "labels" and "attributes" arrays.');
      }
      
      await axios.put(`${API_BASE_URL}/api/projects/${projectId}`, {
        labels: parsedData.labels,
        attributes: parsedData.attributes
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setLabels(parsedData.labels);
      setAttributes(parsedData.attributes);
      setProject(prev => ({ 
        ...prev, 
        labels: parsedData.labels,
        attributes: parsedData.attributes 
      }));
      setPageNotice({ type: 'success', text: 'Project configuration updated successfully.' });
    } catch (error) {
      console.error('Error updating labels and attributes:', error);
      if (error.name === 'SyntaxError') {
        setPageNotice({ type: 'error', text: 'Invalid JSON format.' });
      } else {
        setPageNotice({
          type: 'error',
          text: error.response?.data?.error || error.message || 'Failed to update labels and attributes.'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetJson = () => {
    setRawJsonContent(JSON.stringify({
      labels: labels || [],
      attributes: attributes || []
    }, null, 2));
  };

  const handleAddOwner = async () => {
    if ((!newOwnerEmail.trim() && selectedOwnerTeamIds.length === 0) || !token) return;
    
    try {
      setPageNotice(null);
      await axios.post(`${API_BASE_URL}/api/projects/${projectId}/owners`, {
        emails: newOwnerEmail.trim() ? [newOwnerEmail.trim()] : [],
        teamIds: selectedOwnerTeamIds
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Reload project to get updated owners list
      const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.project) {
        setOwners(response.data.project.ownerDetails || []);
        setProject(prev => ({ 
          ...prev, 
          owners: response.data.project.owners,
          ownerDetails: response.data.project.ownerDetails
        }));
      }
      
      setNewOwnerEmail('');
      setSelectedOwnerTeamIds([]);
      setShowAddOwnerModal(false);
      setPageNotice({ type: 'success', text: 'Project owner updated successfully.' });
    } catch (error) {
      console.error('Error adding owner:', error);
      setPageNotice({ type: 'error', text: error.response?.data?.error || 'Failed to add owner.' });
    }
  };

  const handleRemoveOwner = async (ownerId, ownerName) => {
    if (!token) return;
    
    try {
      setPageNotice(null);
      await axios.delete(`${API_BASE_URL}/api/projects/${projectId}/owners`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: { ownerId }
      });
      
      // Remove from local state
      setOwners(prev => prev.filter(owner => owner.id !== ownerId));
      setProject(prev => ({
        ...prev,
        owners: prev.owners.filter(id => id !== ownerId),
        ownerDetails: prev.ownerDetails.filter(owner => owner.id !== ownerId)
      }));
      
      setShowRemoveOwnerConfirm(null);
      setPageNotice({ type: 'success', text: `Owner ${ownerName} removed successfully.` });
    } catch (error) {
      console.error('Error removing owner:', error);
      setPageNotice({ type: 'error', text: error.response?.data?.error || 'Failed to remove owner.' });
      setShowRemoveOwnerConfirm(null);
    }
  };

  const ownedTeams = teams.filter(team =>
    String(team.createdBy || '') === String(user?.id || '') ||
    (team.createdByEmail && user?.email && team.createdByEmail.toLowerCase() === user.email.toLowerCase())
  );

  const normalizeStatus = (status) => String(status || '').toLowerCase().replace(/\s+/g, '_');
  const completedTasksCount = tasks.filter((task) => normalizeStatus(task.status) === 'completed').length;
  const inProgressTasksCount = tasks.filter((task) => normalizeStatus(task.status) === 'in_progress').length;
  const pendingTasksCount = tasks.filter((task) => normalizeStatus(task.status) === 'pending').length;
  const averageProgress = tasks.length > 0
    ? Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length)
    : 0;
  const driveMessageType = driveMessage.toLowerCase().includes('failed') || driveMessage.toLowerCase().includes('error')
    ? 'error'
    : 'info';

  const handleOwnerTeamToggle = (teamId) => {
    setSelectedOwnerTeamIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleConnectGoogleDrive = async () => {
    if (!token) return;

    try {
      setDriveBusy(true);
      setDriveMessage('');
      const response = await axios.post(
        `${API_BASE_URL}/api/integrations/google-drive/connect`,
        { returnTo: window.location.href },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      console.error('Error starting Google Drive connection:', err);
      setDriveMessage(err.response?.data?.error || 'Failed to start Google Drive connection.');
      setDriveBusy(false);
    }
  };

  const handleEnableDriveBackup = async () => {
    if (!token || !project) return;

    try {
      setDriveBusy(true);
      setDriveMessage('');
      const response = await axios.post(
        `${API_BASE_URL}/api/projects/${projectId}/drive-backup/enable`,
        {
          folderId: driveFolderInput.trim(),
          folderName: `Medical Annotation - ${project.name}`
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setProject(prev => ({
        ...prev,
        driveBackup: {
          ...(prev.driveBackup || {}),
          ...(response.data.driveBackup || {}),
          enabled: true
        }
      }));
      setDriveFolderInput(response.data.driveBackup?.folderId || driveFolderInput);
      setDriveMessage('Google Drive backup is enabled for this project.');
    } catch (err) {
      console.error('Error enabling Google Drive backup:', err);
      setDriveMessage(err.response?.data?.error || 'Failed to enable Google Drive backup.');
    } finally {
      setDriveBusy(false);
    }
  };

  const handleDisableDriveBackup = async () => {
    if (!token || !project) return;

    try {
      setDriveBusy(true);
      setDriveMessage('');
      await axios.post(
        `${API_BASE_URL}/api/projects/${projectId}/drive-backup/disable`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setProject(prev => ({
        ...prev,
        driveBackup: {
          ...(prev.driveBackup || {}),
          enabled: false
        }
      }));
      setShowDisableDriveConfirm(false);
      setDriveMessage('Google Drive backup disabled. Existing Drive files were left untouched.');
    } catch (err) {
      console.error('Error disabling Google Drive backup:', err);
      setDriveMessage(err.response?.data?.error || 'Failed to disable Google Drive backup.');
    } finally {
      setDriveBusy(false);
    }
  };

  const handleSyncDriveBackup = async () => {
    if (!token || !project) return;

    try {
      setDriveBusy(true);
      setDriveMessage('Syncing project files and snapshots to Google Drive...');
      const response = await axios.post(
        `${API_BASE_URL}/api/projects/${projectId}/drive-backup/sync`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setProject(prev => ({
        ...prev,
        driveBackup: {
          ...(prev.driveBackup || {}),
          ...(response.data.driveBackup || {})
        }
      }));

      const summary = response.data.summary;
      const warningText = summary?.failures?.length
        ? ` ${summary.failures.length} item(s) need attention.`
        : '';
      setDriveMessage(`Drive sync complete: ${summary?.files || 0} files, ${summary?.annotations || 0} annotations, ${summary?.exports || 0} export(s).${warningText}`);
    } catch (err) {
      console.error('Error syncing Google Drive backup:', err);
      setDriveMessage(err.response?.data?.error || 'Failed to sync Google Drive backup.');
    } finally {
      setDriveBusy(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!token) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      setPageNotice({ type: 'error', text: error.response?.data?.error || 'Failed to delete project.' });
      setShowDeleteConfirm(false);
    }
  };

  const handleCreateTask = async () => {
    navigate('/tasks', {
      state: { 
        projectId: projectId,
        projectName: project.name,
        openCreateModal: true,
        labels: labels,
        attributes: attributes
      } 
    });
  };

  const filteredTasks = tasks.filter(task =>
    task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigneeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
      case 'in progress':
        return 'status-badge status-in-progress';
      case 'completed':
        return 'status-badge status-completed';
      case 'pending':
        return 'status-badge status-pending';
      default:
        return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
      case 'in progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
      case 'in progress':
        return <Clock3 size={14} />;
      case 'completed':
        return <CheckCircle2 size={14} />;
      case 'pending':
        return <AlertTriangle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const handleExportLabelsAndAttributes = () => {
    const data = {
      labels: labels,
      attributes: attributes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportLabelsAndAttributes = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target.result);
        if (!Array.isArray(content.labels) || !Array.isArray(content.attributes)) {
          throw new Error('Invalid JSON structure. Must have "labels" and "attributes" arrays.');
        }
        setRawJsonContent(JSON.stringify(content, null, 2));
        setPageNotice({ type: 'success', text: 'Configuration file loaded. Save changes to apply it.' });
      } catch (err) {
        setPageNotice({ type: 'error', text: 'Invalid JSON file. It must contain "labels" and "attributes" arrays.' });
      }
    };
    reader.readAsText(file);
  };

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Checking session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="error-container">
        <AlertCircle size={48} className="error-icon" />
        <div className="error-message">{error || 'Project not found'}</div>
        <button
          onClick={() => navigate('/projects')}
          className="back-to-projects-btn"
        >
          <ArrowLeft size={16} />
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="project-detail-container enterprise-page">
      <Header page="projects" />
      
      <div className="project-detail-main">
        <div className="project-page-toolbar">
          <button
            onClick={() => navigate('/projects')}
            className="back-button"
          >
            <ArrowLeft size={16} />
            Back to projects
          </button>
        </div>

        {pageNotice && (
          <div className={`page-notice ${pageNotice.type}`}>
            <AlertCircle size={16} />
            <span>{pageNotice.text}</span>
          </div>
        )}

        <div className="project-header-card">
          <div className="project-hero-grid">
            <div className="project-hero-main">
              <div className="header-content">
                <div className="project-title-section">
                  <div className="title-badge-wrapper">
                    <h1 className="project-title">{project.name}</h1>
                    <span className={`project-status-badge ${project.status}`}>
                      {project.status === 'active' ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  <p className="project-subtitle">
                    Coordinate uploads, ownership, labels, and task execution from one project workspace.
                  </p>
                  <p className="project-meta">
                    <span className="meta-item">
                      <FolderOpen size={14} />
                      ID: {project.id}
                    </span>
                    <span className="meta-item">
                      <Calendar size={14} />
                      Created: {project.createdAt}
                    </span>
                    <span className="meta-item">
                      <Clock size={14} />
                      Last modified: {project.lastModified}
                    </span>
                  </p>

                  <div className="owners-section">
                    <div className="owners-header">
                      <div className="owners-heading">
                        <Users size={14} className="owners-icon" />
                        <span className="owners-label">Project owners</span>
                      </div>
                      <button
                        onClick={() => setShowAddOwnerModal(true)}
                        className="add-owner-btn"
                      >
                        <UserPlus size={14} />
                        Add Owner
                      </button>
                    </div>

                    <div className="owners-list">
                      {owners.map((owner) => (
                        <div key={owner.id} className="owner-chip">
                          <div className="owner-copy">
                            <span className="owner-name">{owner.name || owner.email}</span>
                            <span className="owner-email">{owner.email}</span>
                          </div>
                          {owner.id !== project.createdBy && (
                            <button
                              onClick={() => setShowRemoveOwnerConfirm(owner)}
                              className="owner-remove-btn"
                              title="Remove owner"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="header-actions" ref={actionsMenuRef}>
                  <div className="actions-dropdown-container">
                    <button
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                      className="actions-btn"
                    >
                      Project actions
                      <ChevronDown size={16} className={`dropdown-icon ${showActionsMenu ? 'open' : ''}`} />
                    </button>

                    {showActionsMenu && (
                      <div className="actions-dropdown">
                        <button
                          onClick={handleExportLabelsAndAttributes}
                          className="dropdown-item"
                        >
                          <Download size={14} />
                          Export Config
                        </button>
                        <button
                          onClick={() => document.getElementById('config-upload')?.click()}
                          className="dropdown-item"
                        >
                          <Upload size={14} />
                          Import Config
                        </button>
                        <input
                          id="config-upload"
                          type="file"
                          accept=".json"
                          style={{ display: 'none' }}
                          onChange={handleImportLabelsAndAttributes}
                        />
                        <div className="dropdown-divider"></div>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="dropdown-item delete"
                        >
                          <Trash2 size={14} />
                          Delete Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="description-section">
                <div className="description-header">
                  <div>
                    <h3 className="section-title">Project Description</h3>
                    <p className="section-supporting">
                      Keep the project brief specific enough for owners, annotators, and reviewers.
                    </p>
                  </div>

                  {!editingDescription && (
                    <button
                      onClick={() => setEditingDescription(true)}
                      className="edit-text-btn"
                    >
                      <Edit3 size={14} />
                      Edit Description
                    </button>
                  )}
                </div>

                {editingDescription ? (
                  <div className="description-editor">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="description-textarea"
                      placeholder="Add a description for this project..."
                      rows={4}
                    />
                    <div className="edit-buttons">
                      <button
                        onClick={handleUpdateDescription}
                        className="save-btn"
                        title="Save description"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingDescription(false);
                          setDescription(project.description);
                        }}
                        className="cancel-btn"
                        title="Cancel editing"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="description-display">
                    <p className="description-text">
                      {description || 'No description provided.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className="project-hero-side">
              <div className="overview-card">
                <p className="overview-kicker">Workspace summary</p>
                <div className="overview-grid">
                  <div className="overview-metric">
                    <span className="overview-label">Total tasks</span>
                    <strong className="overview-value">{project.tasks}</strong>
                  </div>
                  <div className="overview-metric">
                    <span className="overview-label">Owners</span>
                    <strong className="overview-value">{owners.length}</strong>
                  </div>
                  <div className="overview-metric">
                    <span className="overview-label">Average progress</span>
                    <strong className="overview-value">{averageProgress}%</strong>
                  </div>
                  <div className="overview-metric">
                    <span className="overview-label">Pending</span>
                    <strong className="overview-value">{pendingTasksCount}</strong>
                  </div>
                  <div className="overview-metric">
                    <span className="overview-label">Drive backup</span>
                    <strong className="overview-value">{project.driveBackup?.enabled ? 'Enabled' : 'Optional'}</strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="project-stats-grid">
          <div className="stat-card">
            <div className="stat-icon tasks-icon">
              <FolderOpen size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{project.tasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon completed-icon">
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{completedTasksCount}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon progress-icon">
              <Clock3 size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{inProgressTasksCount}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon avg-icon">
              <BarChart3 size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{averageProgress}%</div>
              <div className="stat-label">Avg. Progress</div>
            </div>
          </div>
        </div>

        <div className="project-config-grid">
          <div className="configuration-section">
            <div className="config-header">
              <div>
                <h3 className="section-title">Project Configuration</h3>
                <p className="section-supporting">
                  Manage labels and attributes used by tasks and annotation sessions.
                </p>
              </div>
              <div className="config-actions">
                <button onClick={handleExportLabelsAndAttributes} className="icon-btn" title="Export configuration">
                  <Download size={16} />
                </button>
                <button
                  onClick={() => document.getElementById('config-upload')?.click()}
                  className="icon-btn"
                  title="Import configuration"
                >
                  <Upload size={16} />
                </button>
              </div>
            </div>

            <div className="tracker-tabs">
              <button
                onClick={() => setIssueTrackerMode('raw')}
                className={`tracker-tab ${issueTrackerMode === 'raw' ? 'active' : ''}`}
              >
                Raw JSON
              </button>
              <button
                onClick={() => setIssueTrackerMode('constructor')}
                className={`tracker-tab ${issueTrackerMode === 'constructor' ? 'active' : ''}`}
              >
                Constructor
              </button>
            </div>

            {issueTrackerMode === 'raw' && (
              <div className="raw-json-editor">
                <div className="json-editor-header">
                  <small className="json-editor-note">
                    Edit JSON with labels and attributes
                  </small>
                  <button
                    onClick={handleResetJson}
                    className="json-btn reset-btn"
                  >
                    Reset to Current
                  </button>
                </div>
                <textarea
                  value={rawJsonContent}
                  onChange={(e) => setRawJsonContent(e.target.value)}
                  className="json-textarea"
                  placeholder='{"labels": [], "attributes": []}'
                  rows={12}
                />
                <div className="json-actions">
                  <button
                    onClick={handleUpdateLabelsAndAttributes}
                    className="json-btn done-btn"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {issueTrackerMode === 'constructor' && (
              <div className="constructor-view">
                <div className="config-section">
                  <h4 className="config-section-title">
                    <Tag size={16} />
                    Labels ({labels.length})
                  </h4>
                  <div className="labels-container">
                    {labels.map((label, index) => (
                      <div
                        key={index}
                        className="label-chip"
                        style={{ backgroundColor: label.color || '#2f80d0' }}
                      >
                        <span className="label-name">{label.name}</span>
                        <span className="label-type">({label.type})</span>
                      </div>
                    ))}
                    {labels.length === 0 && (
                      <p className="no-config-message">
                        No labels configured. Use the Raw JSON editor to add labels.
                      </p>
                    )}
                  </div>
                </div>

                <div className="config-section">
                  <h4 className="config-section-title">
                    <FileText size={16} />
                    Attributes ({attributes.length})
                  </h4>
                  <div className="attributes-container">
                    {attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="attribute-card"
                      >
                        <div className="attribute-header">
                          <span className="attribute-name">{attr.name}</span>
                          <span className={`attribute-mutable-badge ${attr.mutable ? 'mutable' : 'immutable'}`}>
                            {attr.mutable ? 'Mutable' : 'Immutable'}
                          </span>
                        </div>
                        <div className="attribute-details">
                          <span className="attribute-type">Type: {attr.type}</span>
                          {attr.values && (
                            <span className="attribute-values">Values: {attr.values}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {attributes.length === 0 && (
                      <p className="no-config-message">
                        No attributes configured. Use the Raw JSON editor to add attributes.
                      </p>
                    )}
                  </div>
                </div>

                <div className="constructor-note">
                  <AlertCircle size={16} />
                  <span>Use the Raw JSON editor to modify labels and attributes.</span>
                </div>
              </div>
            )}
          </div>

          <div className="configuration-section drive-section">
            <div className="config-header">
              <div>
                <h3 className="section-title">
                  <Cloud size={18} />
                  Google Drive Backup
                </h3>
                <p className="section-supporting">
                  MongoDB remains the live database. Google Drive stores backup copies of uploaded files,
                  project exports, and annotation JSON snapshots.
                </p>
              </div>
              <span className={`drive-status-pill ${project.driveBackup?.enabled ? 'enabled' : 'optional'}`}>
                {project.driveBackup?.enabled ? 'Enabled' : 'Optional'}
              </span>
            </div>

            {driveMessage && (
              <div className={`drive-message ${driveMessageType}`}>
                {driveMessage}
              </div>
            )}

            {!driveStatus.configured ? (
              <div className="constructor-note">
                <AlertCircle size={16} />
                <span>
                  Google Drive backup is not configured on the server. Set GOOGLE_CLIENT_ID,
                  GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI before connecting.
                </span>
              </div>
            ) : !driveStatus.connected ? (
              <button
                onClick={handleConnectGoogleDrive}
                className="json-btn done-btn"
                disabled={driveBusy}
              >
                <Cloud size={16} />
                {driveBusy ? 'Connecting...' : 'Connect Google Drive'}
              </button>
            ) : (
              <div className="drive-panel">
                <div className="drive-connected-state">
                  Connected as <strong>{driveStatus.email || 'Google Drive user'}</strong>
                </div>

                <div className="drive-input-group">
                  <label className="drive-label">
                    Drive folder URL or ID
                  </label>
                  <input
                    type="text"
                    value={driveFolderInput}
                    onChange={(e) => setDriveFolderInput(e.target.value)}
                    placeholder="Leave empty to create a project backup folder"
                    className="drive-input"
                  />
                  <small className="drive-help">
                    Use a folder that project participants can access, or leave blank and share the created folder manually.
                  </small>
                </div>

                {project.driveBackup?.folderWebViewLink && (
                  <a
                    href={project.driveBackup.folderWebViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="drive-link"
                  >
                    <ExternalLink size={14} />
                    Open backup folder
                  </a>
                )}

                <div className="drive-actions">
                  <button
                    onClick={handleEnableDriveBackup}
                    className="json-btn done-btn"
                    disabled={driveBusy}
                  >
                    <Cloud size={16} />
                    {project.driveBackup?.enabled ? 'Update Folder' : 'Enable Backup'}
                  </button>

                  {project.driveBackup?.enabled && (
                    <>
                      <button
                        onClick={handleSyncDriveBackup}
                        className="json-btn reset-btn"
                        disabled={driveBusy}
                      >
                        <RefreshCw size={16} />
                        {driveBusy ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button
                        onClick={() => setShowDisableDriveConfirm(true)}
                        className="json-btn reset-btn drive-disable-btn"
                        disabled={driveBusy}
                      >
                        Disable Backup
                      </button>
                    </>
                  )}
                </div>

                {project.driveBackup?.lastSyncAt && (
                  <small className="drive-meta">
                    Last sync: {new Date(project.driveBackup.lastSyncAt).toLocaleString()}
                  </small>
                )}
                {project.driveBackup?.lastError && (
                  <small className="drive-meta drive-meta-error">
                    Last Drive warning: {project.driveBackup.lastError}
                  </small>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="tasks-section">
          <div className="tasks-header">
            <div className="tasks-heading-group">
              <h2 className="tasks-title">Tasks</h2>
              <p className="tasks-subtitle">
                Track assignees, progress, and task readiness without leaving the project workspace.
              </p>
            </div>
            <div className="tasks-header-actions">
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <List size={18} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <Grid size={18} />
                </button>
              </div>
              <button 
                onClick={handleCreateTask}
                className="add-task-btn"
              >
                <Plus size={18} />
                New Task
              </button>
            </div>
          </div>

          <div className="search-bar">
            <div className="search-container">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search tasks by name, description, or assignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Tasks List/Grid */}
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={64} className="empty-icon" />
              <h3 className="empty-title">
                {searchTerm ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="empty-subtitle">
                {searchTerm ? 'Try a different search term' : 'Create your first task to get started'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={handleCreateTask}
                  className="empty-action-btn"
                >
                  <Plus size={16} />
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <div className={`tasks-container ${viewMode === 'grid' ? 'tasks-grid' : 'tasks-list'}`}>
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${viewMode === 'grid' ? 'grid-view' : ''}`}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div className="task-content">
                    <div className="task-header">
                      <h3 className="task-name">{task.name || 'Unnamed Task'}</h3>
                      <div className={`${getStatusBadgeClass(task.status)} with-icon`}>
                        {getStatusIcon(task.status)}
                        {getStatusText(task.status)}
                      </div>
                    </div>
                    
                    <p className="task-description">
                      {task.description || 'No description provided'}
                    </p>
                    
                    <div className="task-meta">
                      <div className="meta-item">
                        <Calendar size={12} />
                        <span>{task.createdAt}</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={12} />
                        <span>{task.updatedAt}</span>
                      </div>
                      <div className="meta-item">
                        <Users size={12} />
                        <span className="assignee-name" title={task.assigneeEmail}>
                          {task.assigneeName}
                        </span>
                      </div>
                      <div className="meta-item">
                        <FolderOpen size={12} />
                        <span>{task.filesCount} files</span>
                      </div>
                      <div className="meta-item progress-item">
                        <div className="progress-bar-container">
                          <div className="progress-track">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                          <span className="progress-value">{task.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="task-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks/${task.id}`);
                      }}
                      className="open-task-btn"
                    >
                      <Eye size={16} />
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Owner Modal */}
      {showAddOwnerModal && (
        <div className="modal-overlay">
          <div className="modal-content project-modal">
            <h3 className="modal-title">Add Project Owner</h3>
            <p className="modal-description">
              Enter a user email, select one of your teams, or use both.
            </p>
            <input
              type="email"
              placeholder="user@example.com"
              value={newOwnerEmail}
              onChange={(e) => setNewOwnerEmail(e.target.value)}
              className="modal-input"
              autoFocus
            />
            <div className="modal-section">
              <label className="modal-section-label">
                Teams you created
              </label>
              {ownedTeams.length > 0 ? (
                <div className="team-selector-list">
                  {ownedTeams.map((team, index) => (
                    <label
                      key={team._id}
                      className={`team-selector-row ${index === ownedTeams.length - 1 ? 'team-selector-row-last' : ''}`}
                    >
                      <span className="team-selector-main">
                        <input
                          type="checkbox"
                          checked={selectedOwnerTeamIds.includes(team._id)}
                          onChange={() => handleOwnerTeamToggle(team._id)}
                        />
                        <span>{team.name}</span>
                      </span>
                      <span className="team-selector-count">
                        {(team.members || []).length} members
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="modal-helper">
                  Create a team in the Teams page to add all members as owners.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowAddOwnerModal(false);
                  setSelectedOwnerTeamIds([]);
                }}
                className="modal-btn cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOwner}
                className="modal-btn confirm-btn"
                disabled={!newOwnerEmail.trim() && selectedOwnerTeamIds.length === 0}
              >
                Add Owner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-icon delete-icon">
              <AlertCircle size={32} />
            </div>
            <h3 className="modal-title">Delete Project</h3>
            <p className="modal-description">
              Are you sure you want to delete "<strong>{project.name}</strong>"?
            </p>
            <p className="modal-warning">
              This will delete all associated tasks and files. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="modal-btn cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="modal-btn delete-btn"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisableDriveConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Disable Google Drive backup</h3>
            <p className="modal-description">
              Disable backup for <strong>{project.name}</strong>? Existing files already stored in Drive will not be deleted.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDisableDriveConfirm(false)}
                className="modal-btn cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableDriveBackup}
                className="modal-btn delete-btn"
              >
                Disable Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Owner Confirmation Modal */}
      {showRemoveOwnerConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Remove Owner</h3>
            <p className="modal-description">
              Are you sure you want to remove "<strong>{showRemoveOwnerConfirm.name || showRemoveOwnerConfirm.email}</strong>" as a project owner?
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowRemoveOwnerConfirm(null)}
                className="modal-btn cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveOwner(showRemoveOwnerConfirm.id, showRemoveOwnerConfirm.name || showRemoveOwnerConfirm.email)}
                className="modal-btn delete-btn"
              >
                Remove Owner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
