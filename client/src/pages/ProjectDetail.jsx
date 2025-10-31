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
  Eye
} from 'lucide-react';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [showIssueTracker, setShowIssueTracker] = useState(false);
  const [issueTrackerMode, setIssueTrackerMode] = useState('raw');
  const [labels, setLabels] = useState([]);
  const [rawJsonContent, setRawJsonContent] = useState('[]');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load tasks when project changes or component mounts
  useEffect(() => {
    if (project) {
      loadTasks();
    }
  }, [project]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`);
        const projectData = response.data.project;
        
        setProject({
          id: projectData._id,
          name: projectData.name,
          description: projectData.description || '',
          labels: projectData.labels || [],
          createdAt: new Date(projectData.createdAt).toISOString().split('T')[0],
          status: projectData.status || 'active',
          tasks: projectData.tasks || 0,
          progress: projectData.progress || 0,
          lastModified: new Date(projectData.updatedAt).toLocaleString(),
          createdBy: projectData.createdBy || user?.email || 'Unknown'
        });
        
        setDescription(projectData.description || '');
        setLabels(projectData.labels || []);
        setRawJsonContent(JSON.stringify(projectData.labels || [], null, 2));
        
        // Load tasks for this project
        await loadTasks();
      } catch (error) {
        console.error('Error loading project:', error);
        if (error.response?.status === 404) {
          alert('Project not found');
        } else if (error.response?.status === 401) {
          alert('Please log in again');
          navigate('/login');
        } else {
          alert('Error loading project: ' + (error.response?.data?.error || error.message));
        }
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId, navigate, user]);

  // Listen for storage changes to update tasks when new ones are created
  useEffect(() => {
    const handleStorageChange = () => {
      if (project) {
        loadTasks();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    window.addEventListener('taskCreated', handleStorageChange);
    window.addEventListener('taskDeleted', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('taskCreated', handleStorageChange);
      window.removeEventListener('taskDeleted', handleStorageChange);
    };
  }, [project]);

  const loadTasks = async () => {
    try {
      // TODO: Implement tasks API endpoint
      // For now, we'll load tasks from localStorage or show empty state
      const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const projectTasks = savedTasks.filter(task => task.projectId === project.id);
      setTasks(projectTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  const handleUpdateDescription = async () => {
    try {
      await axios.put(`http://localhost:5000/api/projects/${projectId}`, {
        description: description
      });
      setProject(prev => ({ ...prev, description }));
      setEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleUpdateLabels = async () => {
    try {
      const parsedLabels = JSON.parse(rawJsonContent);
      await axios.put(`http://localhost:5000/api/projects/${projectId}`, {
        labels: parsedLabels
      });
      setLabels(parsedLabels);
      setShowIssueTracker(false);
    } catch (error) {
      console.error('Error updating labels:', error);
      alert('Invalid JSON format');
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
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
        <div>Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div>Project not found</div>
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
      <Header page="projects" />
      
      {/* Main Content */}
      <div style={{ 
        padding: '40px 20px', 
        flex: 1,
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Back to Projects Link */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/projects')}
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
            Back to projects
          </button>
        </div>
        {/* Project Header */}
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
                {project.name}
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Edit3 size={16} color="#6b7280" />
                </button>
              </h1>
              <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
                Project #{project.id} created by {project.createdBy} on {project.createdAt}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Assigned to</p>
                <input
                  type="text"
                  placeholder="Select a user"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '200px'
                  }}
                />
              </div>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Actions
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Project Description */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
                Project description
              </h3>
            </div>
            {editingDescription ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleUpdateDescription}
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
                    onClick={() => setEditingDescription(false)}
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
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ color: '#6b7280', margin: 0, flex: 1 }}>
                  {description || 'No description provided'}
                </p>
                <button
                  onClick={() => setEditingDescription(true)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Issue Tracker */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
                Issue Tracker
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <Edit3 size={14} color="#6b7280" />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => setIssueTrackerMode('raw')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: issueTrackerMode === 'raw' ? '#3b82f6' : '#f3f4f6',
                  color: issueTrackerMode === 'raw' ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Raw
              </button>
              <button
                onClick={() => setIssueTrackerMode('constructor')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: issueTrackerMode === 'constructor' ? '#3b82f6' : '#f3f4f6',
                  color: issueTrackerMode === 'constructor' ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Constructor
              </button>
            </div>

            {issueTrackerMode === 'raw' && (
              <div>
                <textarea
                  value={rawJsonContent}
                  onChange={(e) => setRawJsonContent(e.target.value)}
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={handleUpdateLabels}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => setRawJsonContent(JSON.stringify(labels, null, 2))}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {issueTrackerMode === 'constructor' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Plus size={14} />
                    Add label
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Plus size={14} />
                    Setup skeleton
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Plus size={14} />
                    From model
                  </button>
                </div>
                
                {labels.map((label, index) => (
                  <div key={index} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: label.color || '#8b5cf6',
                    color: 'white',
                    borderRadius: '16px',
                    marginRight: '8px',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    <span>{label.name}</span>
                    <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                      <Edit3 size={12} />
                    </button>
                    <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "95%",
                  padding: '12px 12px 12px 44px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              onClick={() => navigate('/tasks', { 
                state: { 
                  projectId: project.id, 
                  projectName: project.name 
                } 
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.3s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              <Plus size={18} />
              Add task
            </button>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <MessageSquare size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>
                {searchTerm ? 'No tasks found' : 'No tasks found'}
              </h3>
              <p style={{ marginBottom: '24px' }}>
                {searchTerm ? 'Try a different search term' : 'Create your first task to get started'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => navigate('/tasks', { 
                    state: { 
                      projectId: project.id, 
                      projectName: project.name 
                    } 
                  })}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {task.name}
                      </h3>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: getStatusColor(task.status) + '20',
                        color: getStatusColor(task.status)
                      }}>
                        {getStatusText(task.status)}
                      </div>
                    </div>
                    
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      {task.description}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        Created {task.createdAt}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        Updated {task.updatedAt}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} />
                        {task.assignedTo || 'Unassigned'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FolderOpen size={12} />
                        {task.images} images
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks/${task.id}`);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={16} />
                      Open
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit task
                      }}
                      style={{
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={16} color="#6b7280" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
