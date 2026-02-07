import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Header from '../components/Header';
import { 
  ArrowLeft,
  Edit3,
  Check,
  X,
  User,
  Calendar,
  FileText,
  Folder,
  Download,
  BarChart3,
  Target,
  Clock,
  Layers,
  File
} from 'lucide-react';
import '../styles/TaskDetail.css';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const { t } = useTranslation();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTaskName, setEditingTaskName] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [subset, setSubset] = useState('train');
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // API base URL
  const API_BASE_URL = 'http://localhost:5000';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      if (!taskId || !token) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(`${API_BASE_URL}/api/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.task) {
          const taskData = response.data.task;
          setTask(taskData);
          setTaskName(taskData.name);
          setAssignedTo(taskData.assigneeDetails?.email || '');
          setSubset(taskData.subset || 'train');
          setStatus(taskData.status || 'pending');
          setProgress(taskData.progress || 0);
          setDescription(taskData.description || '');
          setFiles(taskData.files || []);
        } else {
          setError('Task not found');
          navigate('/tasks');
        }
      } catch (err) {
        console.error('Error loading task:', err);
        if (err.response?.status === 404) {
          setError('Task not found');
          navigate('/tasks');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this task');
          navigate('/tasks');
        } else {
          setError('Error loading task. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (taskId && token) {
      loadTask();
    }
  }, [taskId, token, navigate]);

  const handleUpdateTask = async (updates) => {
    if (!task || !token) return;
    
    try {
      setIsUpdating(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.task) {
        setTask(response.data.task);
        window.dispatchEvent(new CustomEvent('taskUpdated'));
        return true;
      }
    } catch (err) {
      console.error('Error updating task:', err);
      alert(err.response?.data?.error || 'Failed to update task');
    } finally {
      setIsUpdating(false);
    }
    return false;
  };

  const handleUpdateTaskName = async () => {
    if (!taskName.trim()) {
      alert('Task name cannot be empty');
      return;
    }

    const success = await handleUpdateTask({ name: taskName });
    if (success) {
      setEditingTaskName(false);
    }
  };

  const handleUpdateAssignedTo = async (email) => {
    if (!task || !token) return;
    
    try {
      setIsUpdating(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}/assign`,
        { assigneeEmail: email || null },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Reload task to get updated assignee details
      const taskResponse = await axios.get(`${API_BASE_URL}/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (taskResponse.data.task) {
        setTask(taskResponse.data.task);
        setAssignedTo(taskResponse.data.task.assigneeDetails?.email || '');
        window.dispatchEvent(new CustomEvent('taskUpdated'));
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      alert(err.response?.data?.error || 'Failed to update assignment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSubset = async (newSubset) => {
    const success = await handleUpdateTask({ subset: newSubset });
    if (success) {
      setSubset(newSubset);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    const success = await handleUpdateTask({ status: newStatus });
    if (success) {
      setStatus(newStatus);
    }
  };

  const handleUpdateDescription = async () => {
    const success = await handleUpdateTask({ description });
    if (success) {
      setIsEditingDescription(false);
    }
  };

  const handleUpdateProgress = async (newProgress) => {
    const success = await handleUpdateTask({ progress: newProgress });
    if (success) {
      setProgress(newProgress);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#6b7280';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return '#ef4444';
    if (progress < 70) return '#f59e0b';
    return '#10b981';
  };

  const handleFileDownload = (file) => {
    // Implement file download logic
    console.log('Download file:', file);
    // This would typically trigger a download from the server
  };

  if (loading) {
    return (
      <div className="task-detail-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-detail-error">
        <div className="error-content">
          <div className="error-icon">!</div>
          <h3>{error || 'Task not found'}</h3>
          <p>The requested task could not be found or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/tasks')}
            className="error-button"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-detail-container">
      <Header page="tasks" />
      
      {/* Main Content */}
      <div className="task-detail-content">
        {/* Back Navigation */}
        {/* <nav className="task-breadcrumb">
          <button
            onClick={() => {
              if (task?.projectId) {
                navigate(`/projects/${task.projectId}`);
              } else {
                navigate('/tasks');
              }
            }}
            className="back-button"
          >
            <ArrowLeft size={20} />
            <span>{task?.projectId ? 'Back to project' : 'Back to tasks'}</span>
          </button>
        </nav> */}

        {/* Task Header */}
        <div className="task-header">
          <div className="task-title-section">
            {editingTaskName ? (
              <div className="task-title-edit">
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="title-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateTaskName();
                    } else if (e.key === 'Escape') {
                      setTaskName(task.name);
                      setEditingTaskName(false);
                    }
                  }}
                  autoFocus
                />
                <div className="edit-actions">
                  <button
                    onClick={handleUpdateTaskName}
                    className="action-button save"
                    disabled={isUpdating}
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setTaskName(task.name);
                      setEditingTaskName(false);
                    }}
                    className="action-button cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="task-title-display">
                <h1>{task.name}</h1>
                <button 
                  onClick={() => setEditingTaskName(true)}
                  className="edit-title-button"
                >
                  <Edit3 size={18} />
                </button>
              </div>
            )}
            
            <div className="task-meta">
              <div className="meta-item">
                <User size={16} />
                <span>Created by {task.createdBy || user?.email || 'Unknown'}</span>
              </div>
              <div className="meta-item">
                <Calendar size={16} />
                <span>Created on {formatDate(task.createdAt)}</span>
              </div>
              {task.projectName && (
                <div className="project-badge">
                  <Folder size={16} />
                  <span>Project: {task.projectName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Section */}
          <div className="assignment-section">
            <label className="section-label">Assigned to</label>
            <div className="assignee-input-container">
              <User size={18} className="assignee-icon" />
              <input
                type="email"
                placeholder="Enter user email"
                value={assignedTo}
                onChange={(e) => {
                  const email = e.target.value;
                  setAssignedTo(email);
                }}
                onBlur={(e) => {
                  if (e.target.value !== (task.assigneeDetails?.email || '')) {
                    handleUpdateAssignedTo(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateAssignedTo(e.target.value);
                    e.target.blur();
                  }
                }}
                className="assignee-input"
              />
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="task-statistics">
          <div className="stat-item">
            <div className="stat-icon">
              <File size={24} />
            </div>
            <div className="stat-content">
              <h3>{files.length}</h3>
              <p>Total Files</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon" style={{ color: getStatusColor(status) }}>
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: getStatusColor(status) }}>{getStatusLabel(status)}</h3>
              <p>Current Status</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon" style={{ color: getProgressColor(progress) }}>
              <Target size={24} />
            </div>
            <div className="stat-content">
              <h3 style={{ color: getProgressColor(progress) }}>{progress}%</h3>
              <p>Completion</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Layers size={24} />
            </div>
            <div className="stat-content">
              <h3>{subset.charAt(0).toUpperCase() + subset.slice(1)}</h3>
              <p>Dataset Subset</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="task-content-grid">
          {/* Left Column - Progress & Details */}
          <div className="task-details-column">
            {/* Progress Section */}
            <div className="detail-section">
              <div className="section-header">
                <h3><Target size={20} /> Progress Tracking</h3>
              </div>
              <div className="progress-container">
                <div className="progress-header">
                  <span className="progress-label">Completion</span>
                  <span className="progress-value" style={{ color: getProgressColor(progress) }}>
                    {progress}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: getProgressColor(progress)
                    }}
                  />
                </div>
                <div className="progress-steps">
                  {[0, 25, 50, 75, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleUpdateProgress(value)}
                      className={`progress-step ${value === progress ? 'active' : ''}`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="detail-section">
              <div className="section-header">
                <h3><Layers size={20} /> Task Details</h3>
              </div>
              <div className="details-grid">
                <div className="detail-field">
                  <label>Subset</label>
                  <select
                    value={subset}
                    onChange={(e) => handleUpdateSubset(e.target.value)}
                    className="detail-select"
                  >
                    <option value="train">Train</option>
                    <option value="test">Test</option>
                    <option value="validation">Validation</option>
                  </select>
                </div>
                <div className="detail-field">
                  <label>Status</label>
                  <select
                    value={status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="detail-select status-select"
                    style={{ color: getStatusColor(status) }}
                  >
                    <option value="pending" style={{ color: '#6b7280' }}>Pending</option>
                    <option value="in_progress" style={{ color: '#3b82f6' }}>In Progress</option>
                    <option value="completed" style={{ color: '#10b981' }}>Completed</option>
                    <option value="rejected" style={{ color: '#ef4444' }}>Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Description & Files */}
          <div className="task-content-column">
            {/* Description Section */}
            <div className="detail-section">
              <div className="section-header">
                <h3><FileText size={20} /> Description</h3>
                {!isEditingDescription ? (
                  <button 
                    onClick={() => setIsEditingDescription(true)}
                    className="edit-button"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button
                      onClick={handleUpdateDescription}
                      className="action-button save small"
                      disabled={isUpdating}
                    >
                      <Check size={16} />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setDescription(task.description || '');
                        setIsEditingDescription(false);
                      }}
                      className="action-button cancel small"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {isEditingDescription ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="description-editor"
                  placeholder="Enter task description..."
                  rows={6}
                />
              ) : (
                <div className="description-content">
                  {description || 'No description provided'}
                </div>
              )}
            </div>

            {/* Files Section */}
            {files.length > 0 && (
              <div className="detail-section">
                <div className="section-header">
                  <h3><File size={20} /> Attached Files ({files.length})</h3>
                </div>
                <div className="files-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-icon">
                        <File size={20} />
                      </div>
                      <div className="file-info">
                        <div className="file-name">{file.originalName}</div>
                        <div className="file-details">
                          <span className="file-type">{file.type}</span>
                          <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFileDownload(file)}
                        className="download-button"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={() => navigate(`/annotation/${taskId}`)}
            className="primary-button"
            disabled={isUpdating}
          >
            <Target size={18} />
            Open for Annotation
          </button>
          
          {task.projectId && (
            <button
              onClick={() => navigate(`/projects/${task.projectId}`)}
              className="secondary-button"
            >
              <Folder size={18} />
              View Project
            </button>
          )}
          
          <button
            onClick={() => navigate('/tasks')}
            className="outline-button"
          >
            <ArrowLeft size={18} />
            All Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;