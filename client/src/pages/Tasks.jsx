import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Header from '../components/Header';
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  Circle,
  RectangleHorizontal,
  Shapes,
  PenTool,
  Box,
  Brush,
  X,
  Check,
  Calendar,
  Users,
  Settings,
  Star,
  Clock,
  FolderOpen,
  Tag,
  Palette,
  Upload,
  User,
  UserPlus,
  Mail
} from 'lucide-react';

const Tasks = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  
  // New task form state
  const [newTask, setNewTask] = useState({
    name: "",
    projectId: "",
    projectName: "",
    subset: "train",
    description: "",
    assigneeEmail: "",
    priority: "medium",
    files: []
  });
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [availableAssignees, setAvailableAssignees] = useState([]);

  // Load projects and tasks
  const loadProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      if (response.data.projects) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tasks');
      if (response.data.tasks) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Load available assignees (all users)
  const loadAvailableAssignees = async () => {
    try {
      // In a real app, you'd have a /api/users endpoint
      // For now, we'll get users from the projects they're involved in
      const projectsResponse = await axios.get('http://localhost:5000/api/projects');
      const allUsers = new Set();
      
      if (projectsResponse.data.projects) {
        projectsResponse.data.projects.forEach(project => {
          if (project.ownerDetails) {
            project.ownerDetails.forEach(owner => {
              allUsers.add({
                id: owner.id,
                name: owner.name,
                email: owner.email
              });
            });
          }
        });
      }
      
      setAvailableAssignees(Array.from(allUsers));
    } catch (error) {
      console.error('Error loading assignees:', error);
    }
  };

  useEffect(() => {
    loadProjects();
    loadTasks();
    loadAvailableAssignees();
  }, []);

  // File upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const lowerName = file.name.toLowerCase();
      return lowerName.endsWith('.jpg') || 
             lowerName.endsWith('.jpeg') || 
             lowerName.endsWith('.png') || 
             lowerName.endsWith('.gif') || 
             lowerName.endsWith('.bmp') ||
             lowerName.endsWith('.tiff') ||
             lowerName.endsWith('.nii') ||
             lowerName.endsWith('.nii.gz') ||
             lowerName.endsWith('.dcm');
    });
    
    setNewTask(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  const removeFile = (index) => {
    setNewTask(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const uploadTaskFiles = async (taskId) => {
    if (!newTask.files.length) return [];
    
    const formData = new FormData();
    newTask.files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${taskId}/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              overall: percent,
            }));
          },
        }
      );
      return response.data.files || [];
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error('Failed to upload files: ' + (err.response?.data?.error || err.message));
    }
  };

  // Check if user came from a project detail page and pre-select the project
  useEffect(() => {
    const state = location.state;
    if (state?.projectId) {
      const project = projects.find(p => p._id === state.projectId);
      if (project) {
        setNewTask(prev => ({
          ...prev,
          projectId: project._id,
          projectName: project.name
        }));
      }
      setShowCreateModal(true);
    }
  }, [location.state, projects]);

  // Validate assignee email
  const validateAssigneeEmail = (email) => {
    if (!email) return { valid: true, message: '' };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    
    return { valid: true, message: '' };
  };

  const handleCreateTask = async () => {
    if (!newTask.name.trim()) {
      setSubmitError('Please enter a task name');
      return;
    }

    if (!newTask.projectId) {
      setSubmitError('Please select a project');
      return;
    }

    // Validate assignee email if provided
    if (newTask.assigneeEmail) {
      const validation = validateAssigneeEmail(newTask.assigneeEmail);
      if (!validation.valid) {
        setSubmitError(validation.message);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      // Create task first
      const taskData = {
        name: newTask.name.trim(),
        projectId: newTask.projectId,
        subset: newTask.subset,
        description: newTask.description,
        assigneeEmail: newTask.assigneeEmail || null,
        priority: newTask.priority
      };

      console.log('Creating task with data:', taskData);
      
      const taskResponse = await axios.post(
        'http://localhost:5000/api/tasks',
        taskData
      );

      const taskId = taskResponse.data.task.id;
      console.log('Task created with ID:', taskId);

      // Upload files if any
      let uploadedFilesData = [];
      if (newTask.files.length > 0) {
        try {
          uploadedFilesData = await uploadTaskFiles(taskId);
          console.log('Files uploaded successfully:', uploadedFilesData.length);
        } catch (uploadError) {
          console.error('File upload failed, but task was created:', uploadError);
          // Task was created successfully, just file upload failed
          setSubmitSuccess('Task created successfully, but file upload failed: ' + uploadError.message);
        }
      }

      // Load updated tasks
      await loadTasks();
      
      // Reset form
      setNewTask({ 
        name: "", 
        projectId: "", 
        projectName: "", 
        subset: "train", 
        description: "",
        assigneeEmail: "",
        priority: "medium",
        files: [] 
      });
      setUploadedFiles([]);
      setUploadProgress({});
      setShowCreateModal(false);
      
      if (!submitSuccess) {
        setSubmitSuccess('Task created successfully!');
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error creating task:', error);
      setSubmitError(error.response?.data?.error || error.message || 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reassign task
  const handleReassignTask = async (taskId, taskName, currentAssigneeEmail) => {
    const newAssigneeEmail = prompt(
      `Reassign task "${taskName}"\nCurrent assignee: ${currentAssigneeEmail || 'None'}\n\nEnter new assignee email (leave empty to unassign):`,
      currentAssigneeEmail || ''
    );
    
    if (newAssigneeEmail === null) return; // User cancelled
    
    // Validate email if provided
    if (newAssigneeEmail.trim()) {
      const validation = validateAssigneeEmail(newAssigneeEmail.trim());
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/assign`,
        { assigneeEmail: newAssigneeEmail.trim() || null }
      );
      
      alert(`Task reassigned successfully!`);
      
      // Reload tasks to show updated assignee
      await loadTasks();
    } catch (error) {
      console.error('Error reassigning task:', error);
      alert(error.response?.data?.error || 'Failed to reassign task. Please try again.');
    }
  };

  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(t => t._id || t.id));
    }
  };

  const handleDeleteTask = async (taskId, taskName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${taskName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
      
      // Remove from local state
      setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId && t.id !== taskId));
      alert('Task deleted successfully!');
      
      // Reload tasks to ensure consistency
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error.response?.data?.error || 'Failed to delete task. Please try again.');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (!task) return false;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (task.name && task.name.toLowerCase().includes(searchLower)) ||
      (task.projectName && task.projectName.toLowerCase().includes(searchLower)) ||
      (task.description && task.description.toLowerCase().includes(searchLower)) ||
      (task.assigneeDetails?.name && task.assigneeDetails.name.toLowerCase().includes(searchLower)) ||
      (task.assigneeDetails?.email && task.assigneeDetails.email.toLowerCase().includes(searchLower))
    );
    
    const matchesAssignee = !assigneeSearch || (
      (task.assigneeDetails?.name && task.assigneeDetails.name.toLowerCase().includes(assigneeSearch.toLowerCase())) ||
      (task.assigneeDetails?.email && task.assigneeDetails.email.toLowerCase().includes(assigneeSearch.toLowerCase()))
    );
    
    return matchesSearch && matchesAssignee;
  });

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Get filtered assignees for dropdown
  const filteredAssignees = availableAssignees.filter(assignee => 
    assignee.email.toLowerCase().includes(newTask.assigneeEmail?.toLowerCase() || '') ||
    assignee.name.toLowerCase().includes(newTask.assigneeEmail?.toLowerCase() || '')
  );

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render create task modal
  const renderCreateTaskModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2>Create a new task</h2>
          <button 
            onClick={() => setShowCreateModal(false)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            <X />
          </button>
        </div>

        {/* Basic Configuration */}
        <div style={{marginBottom: '30px'}}>
          <h3 style={{marginBottom: '15px', fontSize: '18px', fontWeight: '600'}}>Basic configuration</h3>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
              Name <span style={{color: 'red'}}>*</span>
            </label>
            <input 
              type="text" 
              placeholder="Enter task name" 
              style={{
                width: '100%', 
                height: '40px', 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              value={newTask.name}
              onChange={(e) => setNewTask({...newTask, name: e.target.value})}
            />
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
              Project <span style={{color: 'red'}}>*</span>
            </label>
            <select 
              style={{
                width: '100%', 
                height: '40px', 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
              value={newTask.projectId}
              onChange={(e) => {
                const selectedProject = projects.find(p => p._id === e.target.value);
                setNewTask({
                  ...newTask,
                  projectId: e.target.value,
                  projectName: selectedProject?.name || ''
                });
              }}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.name} {project.tasks !== undefined ? `(${project.tasks} tasks)` : ''}
                </option>
              ))}
            </select>
            {newTask.projectName && (
              <p style={{fontSize: '12px', color: '#10b981', margin: '4px 0 0 0'}}>
                Selected: {newTask.projectName}
              </p>
            )}
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
              Subset <span style={{color: 'red'}}>*</span>
            </label>
            <select 
              style={{
                width: '100%', 
                height: '40px', 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
              value={newTask.subset}
              onChange={(e) => setNewTask({...newTask, subset: e.target.value})}
            >
              <option value="train">Train</option>
              <option value="test">Test</option>
              <option value="validation">Validation</option>
            </select>
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
              Description (Optional)
            </label>
            <textarea 
              placeholder="Enter task description" 
              style={{
                width: '100%', 
                minHeight: '80px',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
              Assignee (Optional)
            </label>
            <div style={{position: 'relative'}}>
              <input 
                type="text" 
                placeholder="Enter assignee email or name"
                style={{
                  width: '100%', 
                  height: '40px', 
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                value={newTask.assigneeEmail}
                onChange={(e) => setNewTask({...newTask, assigneeEmail: e.target.value})}
                list="assigneeSuggestions"
              />
              
              {filteredAssignees.length > 0 && newTask.assigneeEmail && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {filteredAssignees.map((assignee, index) => (
                    <div
                      key={assignee.id}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: index < filteredAssignees.length - 1 ? '1px solid #f3f4f6' : 'none',
                        backgroundColor: '#fff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => {
                        setNewTask({...newTask, assigneeEmail: assignee.email});
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                      <div style={{fontWeight: '500', color: '#374151'}}>{assignee.name}</div>
                      <div style={{fontSize: '12px', color: '#6b7280'}}>{assignee.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p style={{fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0'}}>
              Leave empty to create unassigned task
            </p>
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
              Priority
            </label>
            <select 
              style={{
                width: '100%', 
                height: '40px', 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Select Files */}
        <div style={{marginBottom: '30px'}}>
          <h3 style={{marginBottom: '15px', fontSize: '18px', fontWeight: '600'}}>
            Select files (Optional)
          </h3>
          
          <div style={{
            border: dragActive ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#eff6ff' : '#f9fafb',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput').click()}
          >
            <input
              id="fileInput"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.nii,.nii.gz,.dcm"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Upload size={48} style={{color: '#3b82f6', marginBottom: '16px'}} />
            <p style={{fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#374151'}}>
              Click or drag files to this area
            </p>
            <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
              You can upload images, NIfTI files, or DICOM files
            </p>
          </div>

          {/* File List */}
          {newTask.files.length > 0 && (
            <div style={{marginTop: '20px'}}>
              <h4 style={{fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#374151'}}>
                Selected Files ({newTask.files.length})
              </h4>
              <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px'}}>
                {newTask.files.map((file, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: index < newTask.files.length - 1 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: '#fff'
                  }}>
                    <div style={{flex: 1}}>
                      <p style={{fontSize: '14px', fontWeight: '500', margin: '0 0 2px 0', color: '#374151'}}>
                        {file.name}
                      </p>
                      <p style={{fontSize: '12px', color: '#6b7280', margin: 0}}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress.overall !== undefined && (
            <div style={{marginTop: '15px'}}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{fontSize: '12px', color: '#64748b'}}>Uploading files...</span>
                <span style={{fontSize: '12px', color: '#64748b'}}>{uploadProgress.overall}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#e2e8f0',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${uploadProgress.overall}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Error and Success Messages */}
        {submitError && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {submitError}
          </div>
        )}
        
        {submitSuccess && (
          <div style={{
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            color: '#065f46',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {submitSuccess}
          </div>
        )}

        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
          <button 
            onClick={() => setShowCreateModal(false)}
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
            Cancel
          </button>
          <button 
            onClick={handleCreateTask}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );

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
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>My Tasks</h1>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: 0
            }}>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{flex: 1, position: 'relative'}}>
            <Search 
              size={20} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}
            />
            <input
              type="text"
              placeholder="Search tasks by name, project, description, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '95%',
                padding: '12px 12px 12px 44px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{position: 'relative', minWidth: '200px'}}>
            <User 
              size={20} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                zIndex: 1
              }}
            />
            <input
              type="text"
              placeholder="Filter by assignee..."
              value={assigneeSearch}
              onChange={(e) => setAssigneeSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
            />
          </div>
          
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569'
            }}
          >
            <Filter size={18} />
            Filter
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569'
            }}
          >
            <SortAsc size={18} />
            Sort
          </button>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <FolderOpen size={64} style={{color: '#cbd5e1', marginBottom: '16px'}} />
            <h3 style={{color: '#475569', marginBottom: '8px'}}>
              {searchTerm || assigneeSearch ? 'No tasks found' : 'No tasks yet'}
            </h3>
            <p style={{color: '#94a3b8', marginBottom: '24px'}}>
              {searchTerm || assigneeSearch ? 'Try a different search term' : 'Create your first task to get started'}
            </p>
            {!searchTerm && !assigneeSearch && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {filteredTasks.map((task) => (
              <div
                key={task._id || task.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '1px solid #e2e8f0'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                {/* Task Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{flex: 1}}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>{task.name}</h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      alignItems: 'center'
                    }}>
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
                      {task.priority && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: task.priority === 'high' ? '#fee2e2' : 
                                          task.priority === 'medium' ? '#fef3c7' : '#d1fae5',
                          color: task.priority === 'high' ? '#dc2626' : 
                                 task.priority === 'medium' ? '#d97706' : '#059669'
                        }}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '4px'}}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks/${task._id || task.id}`);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      title="Open task"
                    >
                      <Eye size={20} color="#3b82f6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task._id || task.id, task.name);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      title="Delete task"
                    >
                      <Trash2 size={20} color="#dc2626" />
                    </button>
                  </div>
                </div>

                {/* Task Details */}
                <div style={{marginBottom: '16px'}}>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '4px'
                  }}>
                    <span style={{fontWeight: '600', minWidth: '70px'}}>Project:</span>
                    <span>{task.projectName || task.project}</span>
                  </p>
                  
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '4px'
                  }}>
                    <span style={{fontWeight: '600', minWidth: '70px'}}>Subset:</span>
                    <span>{task.subset}</span>
                  </p>
                  
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '4px'
                  }}>
                    <span style={{fontWeight: '600', minWidth: '70px'}}>Assignee:</span>
                    <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                      {task.assigneeDetails ? (
                        <>
                          <User size={14} />
                          <span>{task.assigneeDetails.name} ({task.assigneeDetails.email})</span>
                        </>
                      ) : (
                        <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Unassigned</span>
                      )}
                    </span>
                  </p>
                  
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '4px'
                  }}>
                    <span style={{fontWeight: '600', minWidth: '70px'}}>Files:</span>
                    <span>{task.files ? task.files.length : 0}</span>
                  </p>
                </div>

                {/* Progress Bar */}
                <div style={{marginBottom: '16px'}}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{fontSize: '12px', color: '#64748b'}}>Progress</span>
                    <span style={{fontSize: '12px', color: '#64748b'}}>{task.progress || 0}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${task.progress || 0}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Task Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Calendar size={16} color="#64748b" />
                    <div>
                      <p style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        margin: 0
                      }}>Created</p>
                      <p style={{
                        fontSize: '12px',
                        color: '#475569',
                        margin: 0,
                        fontWeight: '500'
                      }}>{formatDate(task.createdAt)}</p>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Clock size={16} color="#64748b" />
                    <div>
                      <p style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        margin: 0
                      }}>Updated</p>
                      <p style={{
                        fontSize: '12px',
                        color: '#475569',
                        margin: 0,
                        fontWeight: '500'
                      }}>{formatDate(task.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px'
                }}>
                  <button
                    onClick={() => navigate(`/tasks/${task._id || task.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={16} />
                    Open Task
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReassignTask(task._id || task.id, task.name, task.assigneeDetails?.email);
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e0f2fe'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                    title="Reassign task"
                  >
                    <UserPlus size={16} color="#0284c7" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && renderCreateTaskModal()}
    </div>
  );
};

export default Tasks;