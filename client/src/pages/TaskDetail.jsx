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
  Layers,
  File,
  Trash2,
  Plus,
  UploadCloud
} from 'lucide-react';
import '../styles/TaskDetail.css';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const { t } = useTranslation();
  
  // --- STATE ---
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit States
  const [editingTaskName, setEditingTaskName] = useState(false);
  const [taskName, setTaskName] = useState('');
  
  // Assignee States
  const [assignees, setAssignees] = useState([]); 
  const [newAssigneeInput, setNewAssigneeInput] = useState('');
  
  // Task Details States
  const [subset, setSubset] = useState('train');
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(''); 
  
  // Data Lists
  const [files, setFiles] = useState([]);
  const [projectsList, setProjectsList] = useState([]); 
  
  // UI States
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // New state for file upload

  // API base URL
  const API_BASE_URL = 'http://localhost:5000';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // --- LOAD DATA ---
  useEffect(() => {
    const fetchData = async () => {
      if (!taskId || !token) return;
      
      try {
        setLoading(true);
        setError('');
        
        // 1. Fetch Task Details
        const taskResponse = await axios.get(`${API_BASE_URL}/api/tasks/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 2. Fetch Projects (for the dropdown)
        const projectsResponse = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (taskResponse.data.task) {
          const taskData = taskResponse.data.task;
          setTask(taskData);
          setTaskName(taskData.name);
          
          // Handle Assignees
          if (taskData.assignees && Array.isArray(taskData.assignees)) {
            setAssignees(taskData.assignees);
          } else if (taskData.assigneeDetails?.email) {
            setAssignees([taskData.assigneeDetails.email]);
          } else {
            setAssignees([]);
          }

          setSubset(taskData.subset || 'train');
          setStatus(taskData.status || 'pending');
          setProgress(taskData.progress || 0);
          setDescription(taskData.description || '');
          setFiles(taskData.files || []);
          setProjectId(taskData.projectId || '');
        } else {
          setError('Task not found');
        }

        if (projectsResponse.data.projects) {
          setProjectsList(projectsResponse.data.projects);
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error loading task details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, token, navigate]);

  // --- CORE UPDATE HELPER ---
  const handleUpdateTask = async (updates) => {
    if (!task || !token) return false;
    
    try {
      setIsUpdating(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}`,
        updates,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.task) {
        setTask(response.data.task);
        
        // If Project ID changed, find the new project name for the UI header
        if (updates.projectId) {
            const newProj = projectsList.find(p => p._id === updates.projectId);
            if(newProj) {
                setTask(prev => ({ ...prev, projectName: newProj.name }));
            }
        }
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

  // --- SPECIFIC FIELD HANDLERS ---

  const handleUpdateTaskName = async () => {
    if (!taskName.trim()) return alert('Task name cannot be empty');
    if (await handleUpdateTask({ name: taskName })) {
      setEditingTaskName(false);
    }
  };

  // CHANGE PROJECT HANDLER
  const handleUpdateProjectId = async (newId) => {
    if (await handleUpdateTask({ projectId: newId })) {
      setProjectId(newId);
    }
  };

  // --- MULTIPLE ASSIGNEES LOGIC ---

  const handleAddAssignee = async () => {
    if (!newAssigneeInput.trim() || !newAssigneeInput.includes('@')) {
        return alert("Please enter a valid email address");
    }
    if (assignees.includes(newAssigneeInput.trim())) {
        setNewAssigneeInput('');
        return; 
    }

    const updatedList = [...assignees, newAssigneeInput.trim()];
    await syncAssignees(updatedList);
    setNewAssigneeInput('');
  };

  const handleRemoveAssignee = async (emailToRemove) => {
    const updatedList = assignees.filter(email => email !== emailToRemove);
    await syncAssignees(updatedList);
  };

  const syncAssignees = async (newList) => {
    try {
        setIsUpdating(true);
        const response = await axios.put(
            `${API_BASE_URL}/api/tasks/${taskId}/assign`,
            { assigneeEmails: newList },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.data.task) {
            setAssignees(response.data.task.assignees || []);
            setTask(response.data.task);
        }
    } catch (err) {
        console.error('Error updating assignees:', err);
        alert(err.response?.data?.error || 'Failed to update assignees');
    } finally {
        setIsUpdating(false);
    }
  };

  // --- FILE LOGIC (UPLOAD & DELETE) ---

  // 1. UPLOAD FILES
  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });

    try {
        setIsUploading(true);
        const response = await axios.post(
            `${API_BASE_URL}/api/tasks/${taskId}/files`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        // Backend should return the newly added files
        if (response.data.files) {
            // Append new files to existing list
            setFiles(prev => [...prev, ...response.data.files]);
            
            // Update total count
            setTask(prev => ({
                ...prev,
                totalItems: (prev.totalItems || 0) + response.data.files.length
            }));
            
            alert("Files uploaded successfully!");
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert(err.response?.data?.error || "Failed to upload files");
    } finally {
        setIsUploading(false);
        // Reset file input value so same file can be selected again if needed
        e.target.value = null;
    }
  };

  // 2. DELETE FILES
  const handleDeleteFile = async (file) => {
    const fileId = file._id || file.id; 
    if (!fileId) return alert("Error: File ID is missing");

    if (!window.confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
        return;
    }

    try {
        setIsUpdating(true);
        await axios.delete(`${API_BASE_URL}/api/tasks/${taskId}/files/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Update local state to remove file immediately
        setFiles(prevFiles => prevFiles.filter(f => (f._id || f.id) !== fileId));
        setTask(prev => ({
            ...prev,
            totalItems: (prev.totalItems || 1) - 1
        }));

    } catch (err) {
        console.error('Error deleting file:', err);
        alert(err.response?.data?.error || 'Failed to delete file');
    } finally {
        setIsUpdating(false);
    }
  };

  const handleFileDownload = (file) => {
    // Basic implementation - can be enhanced with specific API route
    alert(`Downloading ${file.originalName}...`);
  };

  // --- SIMPLE FIELD UPDATERS ---
  const handleUpdateSubset = async (val) => { if(await handleUpdateTask({ subset: val })) setSubset(val); };
  const handleUpdateStatus = async (val) => { if(await handleUpdateTask({ status: val })) setStatus(val); };
  const handleUpdateProgress = async (val) => { if(await handleUpdateTask({ progress: val })) setProgress(val); };
  const handleUpdateDescription = async () => { if(await handleUpdateTask({ description })) setIsEditingDescription(false); };

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (s) => {
    const map = { pending: '#6b7280', in_progress: '#3b82f6', completed: '#10b981', rejected: '#ef4444' };
    return map[s] || '#6b7280';
  };
  const getProgressColor = (p) => p < 30 ? '#ef4444' : p < 70 ? '#f59e0b' : '#10b981';

  if (loading) return <div className="task-detail-loading"><div className="loading-spinner"></div></div>;
  if (error || !task) return (
    <div className="task-detail-error">
      <h3>{error || 'Task not found'}</h3>
      <button onClick={() => navigate('/tasks')}>Back to Tasks</button>
    </div>
  );

  return (
    <div className="task-detail-container">
      <Header page="tasks" />
      
      <div className="task-detail-content">
        {/* === HEADER SECTION === */}
        <div className="task-header">
          <div className="task-title-section">
            {editingTaskName ? (
              <div className="task-title-edit">
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="title-input"
                  autoFocus
                />
                <div className="edit-actions">
                  <button onClick={handleUpdateTaskName} className="action-button save" disabled={isUpdating}><Check size={18} /></button>
                  <button onClick={() => { setTaskName(task.name); setEditingTaskName(false); }} className="action-button cancel"><X size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="task-title-display">
                <h1>{task.name}</h1>
                <button onClick={() => setEditingTaskName(true)} className="edit-title-button"><Edit3 size={18} /></button>
              </div>
            )}
            
            <div className="task-meta">
              <div className="meta-item"><User size={16} /> Created by {task.createdBy || user?.email}</div>
              <div className="meta-item"><Calendar size={16} /> {formatDate(task.createdAt)}</div>
              <div className="meta-item project-badge">
                <Folder size={16} /> {task.projectName || 'No Project'}
              </div>
            </div>
          </div>

          {/* === MULTIPLE ASSIGNEES SECTION === */}
          <div className="assignment-section">
            <label className="section-label">Assigned People</label>
            
            <div className="assignees-list-container">
                {assignees.map((email, idx) => (
                    <div key={idx} className="assignee-tag">
                        <User size={12} style={{marginRight: '4px'}}/>
                        <span>{email}</span>
                        <button 
                            onClick={() => handleRemoveAssignee(email)} 
                            className="remove-assignee-btn"
                            disabled={isUpdating}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="assignee-input-wrapper" style={{marginTop: '10px', display: 'flex', gap: '8px'}}>
                <input
                    type="email"
                    placeholder="Add user by email..."
                    value={newAssigneeInput}
                    onChange={(e) => setNewAssigneeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAssignee()}
                    className="assignee-input-mini"
                    style={{flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd'}}
                />
                <button 
                    onClick={handleAddAssignee}
                    className="add-assignee-btn"
                    disabled={isUpdating}
                    style={{
                        background: '#f3f4f6', border: '1px solid #ddd', borderRadius: '4px', 
                        padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                >
                    <Plus size={16} />
                </button>
            </div>
          </div>
        </div>

        {/* === STATISTICS === */}
        <div className="task-statistics">
          <div className="stat-item">
            <div className="stat-icon"><File size={24} /></div>
            <div className="stat-content">
              <h3>{files.length}</h3>
              <p>Total Files</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon" style={{ color: getStatusColor(status) }}><BarChart3 size={24} /></div>
            <div className="stat-content">
              <h3 style={{ color: getStatusColor(status) }}>{status.replace('_', ' ').toUpperCase()}</h3>
              <p>Status</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon" style={{ color: getProgressColor(progress) }}><Target size={24} /></div>
            <div className="stat-content">
              <h3 style={{ color: getProgressColor(progress) }}>{progress}%</h3>
              <p>Completion</p>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT GRID === */}
        <div className="task-content-grid">
          
          {/* LEFT COLUMN */}
          <div className="task-details-column">
            
            {/* Progress */}
            <div className="detail-section">
              <div className="section-header"><h3><Target size={20} /> Progress</h3></div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: getProgressColor(progress) }} />
                </div>
                <div className="progress-steps">
                  {[0, 25, 50, 75, 100].map((v) => (
                    <button key={v} onClick={() => handleUpdateProgress(v)} className={`progress-step ${v === progress ? 'active' : ''}`}>{v}%</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Config Details */}
            <div className="detail-section">
              <div className="section-header"><h3><Layers size={20} /> Configuration</h3></div>
              <div className="details-grid">
                
                {/* PROJECT SELECTION (Modified) */}
                <div className="detail-field">
                  <label>Project</label>
                  <select 
                    value={projectId} 
                    onChange={(e) => handleUpdateProjectId(e.target.value)} 
                    className="detail-select"
                    disabled={isUpdating}
                  >
                    <option value="" disabled>Select Project</option>
                    {projectsList.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="detail-field">
                  <label>Subset</label>
                  <select value={subset} onChange={(e) => handleUpdateSubset(e.target.value)} className="detail-select">
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
                    className="detail-select"
                    style={{color: getStatusColor(status), fontWeight: 'bold'}}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="task-content-column">
            
            {/* Description */}
            <div className="detail-section">
              <div className="section-header">
                <h3><FileText size={20} /> Description</h3>
                {!isEditingDescription ? (
                  <button onClick={() => setIsEditingDescription(true)} className="edit-button"><Edit3 size={16} /> Edit</button>
                ) : (
                  <div className="edit-actions">
                    <button onClick={handleUpdateDescription} className="action-button save small"><Check size={16} /> Save</button>
                    <button onClick={() => { setDescription(task.description || ''); setIsEditingDescription(false); }} className="action-button cancel small"><X size={16} /> Cancel</button>
                  </div>
                )}
              </div>
              {isEditingDescription ? (
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="description-editor" rows={6} />
              ) : (
                <div className="description-content">{description || 'No description provided'}</div>
              )}
            </div>

            {/* === FILES SECTION (Uploaded, Delete, Add New) === */}
            <div className="detail-section">
              <div className="section-header">
                <h3><File size={20} /> Files ({files.length})</h3>
                
                {/* UPLOAD BUTTON */}
                <label className={`action-button small ${isUploading ? 'disabled' : ''}`} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid #ddd'}}>
                    {isUploading ? (
                        <span>Uploading...</span>
                    ) : (
                        <>
                            <UploadCloud size={16} /> Add Files
                        </>
                    )}
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileUpload} 
                        style={{display: 'none'}} 
                        disabled={isUploading}
                    />
                </label>
              </div>

              {files.length > 0 ? (
                  <div className="files-list">
                    {files.map((file, index) => (
                        <div key={file._id || index} className="file-item">
                        <div className="file-icon"><File size={20} /></div>
                        <div className="file-info">
                            <div className="file-name">{file.originalName}</div>
                            <div className="file-details">
                            <span className="file-type">{file.type || 'file'}</span>
                            <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                            </div>
                        </div>
                        
                        <div className="file-actions" style={{display: 'flex', gap: '8px'}}>
                            <button onClick={() => handleFileDownload(file)} className="download-button" title="Download">
                                <Download size={18} />
                            </button>
                            
                            <button 
                                onClick={() => handleDeleteFile(file)} 
                                className="delete-button" 
                                title="Delete File"
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', 
                                    color: '#ef4444', padding: '4px'
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        </div>
                    ))}
                  </div>
              ) : (
                  <div className="no-files-message" style={{padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic'}}>
                      No files attached. Click "Add Files" to upload.
                  </div>
              )}
            </div>

          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="action-buttons">
          <button onClick={() => navigate(`/annotation/${taskId}`)} className="primary-button" disabled={isUpdating}>
            <Target size={18} /> Open for Annotation
          </button>
          {task.projectId && (
            <button onClick={() => navigate(`/projects/${task.projectId}`)} className="secondary-button">
              <Folder size={18} /> View Project
            </button>
          )}
          <button onClick={() => navigate('/tasks')} className="outline-button">
            <ArrowLeft size={18} /> All Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
