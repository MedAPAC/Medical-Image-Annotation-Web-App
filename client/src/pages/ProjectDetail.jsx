import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import Header from '../components/Header';
import { 
  ArrowLeft,
  Edit3,
  MoreHorizontal,
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
  Settings,
  Tag,
  FileText,
  AlertCircle
} from 'lucide-react';
import '../styles/ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [issueTrackerMode, setIssueTrackerMode] = useState('raw');
  const [labels, setLabels] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [rawJsonContent, setRawJsonContent] = useState('{"labels":[],"attributes":[]}');
  const [ownerEmails, setOwnerEmails] = useState('');
  const [owners, setOwners] = useState([]);
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveOwnerConfirm, setShowRemoveOwnerConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const API_BASE_URL = 'http://localhost:5000';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || !token) return;
      
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
            ownerDetails: projectData.ownerDetails || []
          });
          
          setDescription(projectData.description || '');
          setLabels(projectData.labels || []);
          setAttributes(projectData.attributes || []);
          setRawJsonContent(JSON.stringify({
            labels: projectData.labels || [],
            attributes: projectData.attributes || []
          }, null, 2));
          setOwners(projectData.ownerDetails || []);
          
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

    if (projectId && token) {
      loadProject();
    }
  }, [projectId, token, navigate]);

  // Load tasks for this project
  const loadTasks = async () => {
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
  };

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
  }, []);

  const handleUpdateDescription = async () => {
    if (!project || !token) return;
    
    try {
      await axios.put(`${API_BASE_URL}/api/projects/${projectId}`, {
        description: description
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setProject(prev => ({ ...prev, description }));
      setEditingDescription(false);
      
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
      alert(error.response?.data?.error || 'Failed to update description');
    }
  };

  const handleUpdateLabelsAndAttributes = async () => {
    if (!project || !token) return;
    
    try {
      setSaving(true);
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
      
      alert('Labels and attributes updated successfully!');
    } catch (error) {
      console.error('Error updating labels and attributes:', error);
      if (error.name === 'SyntaxError') {
        alert('Invalid JSON format');
      } else {
        alert(error.response?.data?.error || error.message || 'Failed to update labels and attributes');
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
    if (!newOwnerEmail.trim() || !token) return;
    
    try {
      await axios.post(`${API_BASE_URL}/api/projects/${projectId}/owners`, {
        emails: [newOwnerEmail.trim()]
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
      setShowAddOwnerModal(false);
      alert('Owner added successfully');
    } catch (error) {
      console.error('Error adding owner:', error);
      alert(error.response?.data?.error || 'Failed to add owner');
    }
  };

  const handleRemoveOwner = async (ownerId, ownerName) => {
    if (!token) return;
    
    try {
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
      alert(`Owner ${ownerName} removed successfully`);
    } catch (error) {
      console.error('Error removing owner:', error);
      alert(error.response?.data?.error || 'Failed to remove owner');
      setShowRemoveOwnerConfirm(null);
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
      
      alert('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.response?.data?.error || 'Failed to delete project');
      setShowDeleteConfirm(false);
    }
  };

  const handleCreateTask = async () => {
    navigate('/tasks/create', { 
      state: { 
        projectId: projectId,
        projectName: project.name,
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
        alert('File loaded successfully! Click "Save Changes" to apply.');
      } catch (err) {
        alert('Invalid JSON file. Must contain "labels" and "attributes" arrays.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="loading-container">
        <div>{error || 'Project not found'}</div>
        <button
          onClick={() => navigate('/projects')}
          className="back-button"
          style={{ marginTop: '20px' }}
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      <Header page="projects" />
      
      <div className="project-detail-main">
        {/* Back Button */}
        <button
          onClick={() => navigate('/projects')}
          className="back-button"
        >
          <ArrowLeft size={16} />
          Back to projects
        </button>

        {/* Project Header Card */}
        <div className="project-header-card">
          <div className="header-content">
            <div className="project-title-section">
              <h1 className="project-title">
                {project.name}
                <span className="project-status-badge">
                  {project.status === 'active' ? 'Active' : 'Archived'}
                </span>
              </h1>
              <p className="project-meta">
                Project ID: {project.id} • {project.tasks} tasks • Last modified: {project.lastModified}
              </p>
              
              {/* Owners list */}
              <div className="owners-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <Users size={14} color="#64748b" />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Owners:</span>
                  {owners.map((owner, index) => (
                    <div key={owner.id} className="owner-chip">
                      <span>{owner.name || owner.email}</span>
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
                  <button
                    onClick={() => setShowAddOwnerModal(true)}
                    className="add-owner-btn"
                  >
                    <UserPlus size={14} />
                    Add Owner
                  </button>
                </div>
              </div>
            </div>
            
            <div className="header-actions">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="actions-btn"
              >
                Actions
                <MoreHorizontal size={16} />
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

          {/* Project Description */}
          <div className="description-section">
            <h3 className="section-title">Project Description</h3>
            {editingDescription ? (
              <div className="description-editor">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="description-textarea"
                  placeholder="Add a description for this project..."
                  rows={3}
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', justifyContent: 'space-between' }}>
                <p className="description-text">
                  {description || 'No description provided.'}
                </p>
                <button
                  onClick={() => setEditingDescription(true)}
                  className="edit-text-btn"
                >
                  Edit Description
                </button>
              </div>
            )}
          </div>

          {/* Project Stats */}
          <div className="project-stats">
            <div className="stat-item">
              <div className="stat-value">{project.tasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{tasks.filter(t => t.status === 'completed').length}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{tasks.filter(t => t.status === 'in_progress').length}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {tasks.length > 0 
                  ? Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length)
                  : 0}%
              </div>
              <div className="stat-label">Avg. Progress</div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="configuration-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 className="section-title">Project Configuration</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <small style={{ color: '#6b7280' }}>
                    Edit JSON with labels and attributes
                  </small>
                  <button
                    onClick={handleResetJson}
                    className="json-btn reset-btn"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
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
                {/* Labels Preview */}
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
                        style={{ backgroundColor: label.color || '#8b5cf6' }}
                      >
                        <span>{label.name}</span>
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

                {/* Attributes Preview */}
                <div className="config-section">
                  <h4 className="config-section-title">
                    <FileText size={16} />
                    Attributes ({attributes.length})
                  </h4>
                  <div className="attributes-container">
                    {attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="attribute-chip"
                      >
                        <span className="attribute-name">{attr.name}</span>
                        <span className="attribute-type">({attr.type})</span>
                        {attr.values && (
                          <span className="attribute-values">Values: {attr.values}</span>
                        )}
                        <span className={`attribute-mutable ${attr.mutable ? 'mutable' : 'immutable'}`}>
                          {attr.mutable ? 'Mutable' : 'Immutable'}
                        </span>
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
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
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
            </div>

            <button 
              onClick={handleCreateTask}
              className="add-task-btn"
            >
              <Plus size={18} />
              Add New Task
            </button>
          </div>

          {/* Tasks List */}
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
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div className="task-content">
                    <div className="task-header">
                      <h3 className="task-name">{task.name || 'Unnamed Task'}</h3>
                      <div className={getStatusBadgeClass(task.status)}>
                        {getStatusText(task.status)}
                      </div>
                    </div>
                    
                    <p className="task-description">
                      {task.description || 'No description provided'}
                    </p>
                    
                    <div className="task-meta">
                      <div className="meta-item">
                        <Calendar size={12} />
                        Created {task.createdAt}
                      </div>
                      <div className="meta-item">
                        <Clock size={12} />
                        Updated {task.updatedAt}
                      </div>
                      <div className="meta-item">
                        <Users size={12} />
                        {task.assigneeName}
                        {task.assigneeEmail && ` (${task.assigneeEmail})`}
                      </div>
                      <div className="meta-item">
                        <FolderOpen size={12} />
                        {task.filesCount} files
                      </div>
                      <div className="meta-item progress-item">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span>{task.progress || 0}%</span>
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
          <div className="modal-content">
            <h3 className="modal-title">Add Project Owner</h3>
            <p className="modal-description">
              Enter the email address of the user you want to add as a project owner.
            </p>
            <input
              type="email"
              placeholder="user@example.com"
              value={newOwnerEmail}
              onChange={(e) => setNewOwnerEmail(e.target.value)}
              className="modal-input"
            />
            <div className="modal-actions">
              <button
                onClick={() => setShowAddOwnerModal(false)}
                className="modal-btn cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOwner}
                className="modal-btn confirm-btn"
                disabled={!newOwnerEmail.trim()}
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
          <div className="modal-content">
            <h3 className="modal-title">Delete Project</h3>
            <p className="modal-description">
              Are you sure you want to delete "<strong>{project.name}</strong>"?<br />
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