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
  FileText
} from 'lucide-react';

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
  const [subset, setSubset] = useState('');
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);

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
      alert('Description updated successfully');
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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div>Loading task details...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ color: '#ef4444', marginBottom: '20px' }}>{error || 'Task not found'}</div>
        <button
          onClick={() => navigate('/tasks')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header page="tasks" />
      
      {/* Main Content */}
      <div style={{ 
        padding: '40px 20px', 
        flex: 1,
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Back to Project/Tasks Link */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (task?.projectId) {
                navigate(`/projects/${task.projectId}`);
              } else {
                navigate('/tasks');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              padding: '8px 0'
            }}
          >
            <ArrowLeft size={16} />
            {task?.projectId ? 'Back to project' : 'Back to tasks'}
          </button>
        </div>

        {/* Task Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {editingTaskName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}
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
                    <button
                      onClick={handleUpdateTaskName}
                      style={{
                        padding: '8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setTaskName(task.name);
                        setEditingTaskName(false);
                      }}
                      style={{
                        padding: '8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    {task.name}
                    <button 
                      onClick={() => setEditingTaskName(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit3 size={16} color="#6b7280" />
                    </button>
                  </>
                )}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
                  <User size={14} />
                  <span>Created by {task.createdBy || user?.email || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
                  <Calendar size={14} />
                  <span>Created on {formatDate(task.createdAt)}</span>
                </div>
                {task.projectName && (
                  <div style={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    Project: {task.projectName}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Assigned to
                </label>
                <input
                  type="email"
                  placeholder="Enter user email"
                  value={assignedTo}
                  onChange={(e) => {
                    const email = e.target.value;
                    setAssignedTo(email);
                  }}
                  onBlur={(e) => {
                    handleUpdateAssignedTo(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateAssignedTo(e.target.value);
                      e.target.blur();
                    }
                  }}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '300px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Progress</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: getProgressColor(progress) }}>
                {progress}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: getProgressColor(progress),
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              {[0, 25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => handleUpdateProgress(value)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: value === progress ? '#3b82f6' : '#f3f4f6',
                    color: value === progress ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>

          {/* Task Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Subset
              </label>
              <select
                value={subset}
                onChange={(e) => handleUpdateSubset(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  width: '100%'
                }}
              >
                <option value="train">Train</option>
                <option value="test">Test</option>
                <option value="validation">Validation</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  width: '100%',
                  color: getStatusColor(status)
                }}
              >
                <option value="pending" style={{ color: '#6b7280' }}>Pending</option>
                <option value="in_progress" style={{ color: '#3b82f6' }}>In Progress</option>
                <option value="completed" style={{ color: '#10b981' }}>Completed</option>
                <option value="rejected" style={{ color: '#ef4444' }}>Rejected</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleUpdateDescription}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Add task description..."
            />
          </div>

          {/* Files Section */}
          {files.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Files ({files.length})
              </label>
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                padding: '16px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {files.map((file, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderBottom: index < files.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>{file.originalName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {file.type} • {(file.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate(`/annotation/${taskId}`)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Open for Annotation
            </button>
            
            {task.projectId && (
              <button
                onClick={() => navigate(`/projects/${task.projectId}`)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                View Project
              </button>
            )}
          </div>
        </div>

        {/* Task Statistics */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{files.length}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Files</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor(status) }}>
              {getStatusLabel(status)}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Current Status</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getProgressColor(progress) }}>
              {progress}%
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Completion</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{subset}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Dataset Subset</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;