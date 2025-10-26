import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  MoreHorizontal,
  Edit3,
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
  LogOut,
  User,
  Upload
} from 'lucide-react';

// Header component with authentication
function Header({ page, setPage }) {
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
            color: page === "projects" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = page === "projects" ? "#0066cc" : "#004c99";
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
            color: page === "upload" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = page === "upload" ? "#0066cc" : "#004c99";
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
            color: page === "home" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = page === "home" ? "#0066cc" : "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Home
        </button>
        <button
          onClick={() => navigate('/tasks')}
          style={{
            cursor: "pointer",
            fontSize: "16px",
            color: page === "tasks" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = page === "tasks" ? "#0066cc" : "#004c99";
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

const Tasks = () => {
  const { isAuthenticated } = useAuth();
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
  
  // New task form state
  const [newTask, setNewTask] = useState({
    name: "",
    project: "",
    subset: "",
    files: []
  });
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

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
      // TODO: Implement tasks API endpoint
      // For now, we'll load tasks from localStorage
      const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      setTasks(savedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  useEffect(() => {
    loadProjects();
    loadTasks();
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

  const uploadFiles = async () => {
    const uploadedFileData = [];
    
    for (const file of newTask.files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post("http://localhost:5000/upload", formData, {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percent,
            }));
          },
        });

        uploadedFileData.push({
          originalName: file.name,
          filename: res.data.filename,
          type: file.name.toLowerCase().endsWith('.dcm') ? 'dicom' : 
                file.name.toLowerCase().endsWith('.nii') || file.name.toLowerCase().endsWith('.nii.gz') ? 'nifti' : 'image'
        });
      } catch (err) {
        console.error("Upload error:", err);
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      }
    }
    
    setUploadedFiles(uploadedFileData);
    return uploadedFileData;
  };

  // Check if user came from a project detail page and pre-select the project
  useEffect(() => {
    const state = location.state;
    if (state?.projectId && state?.projectName) {
      setNewTask(prev => ({
        ...prev,
        project: state.projectName
      }));
      setShowCreateModal(true);
    }
  }, [location.state]);

  const handleCreateTask = async () => {
    if (!newTask.name.trim()) {
      setSubmitError('Please enter a task name');
      return;
    }

    if (!newTask.project) {
      setSubmitError('Please select a project');
      return;
    }

    if (!newTask.subset) {
      setSubmitError('Please select a subset');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      // Upload files first if any
      let uploadedFileData = [];
      if (newTask.files.length > 0) {
        uploadedFileData = await uploadFiles();
      }

      // TODO: Implement task creation API
      const task = {
        id: Date.now(),
        name: newTask.name,
        project: newTask.project,
        projectId: projects.find(p => p.name === newTask.project)?._id || projects.find(p => p.name === newTask.project)?.id,
        subset: newTask.subset,
        files: uploadedFileData,
        status: "pending",
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: "Just now",
        images: uploadedFileData.length,
        progress: 0
      };
      
      // Save to localStorage for persistence
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const updatedTasks = [...existingTasks, task];
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      
      setTasks([...tasks, task]);
      setNewTask({ name: "", project: "", subset: "", files: [] });
      setUploadedFiles([]);
      setUploadProgress({});
      setShowCreateModal(false);
      setSubmitSuccess('Task created successfully!');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('taskCreated', { detail: task }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error creating task:', error);
      setSubmitError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      setSelectedTasks(filteredTasks.map(t => t.id));
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
      // TODO: Implement task deletion API
      // Remove from localStorage
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const updatedTasks = existingTasks.filter(t => t.id !== taskId);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      alert('Task deleted successfully!');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('taskDeleted', { detail: { taskId } }));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.project.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect
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
              value={newTask.project}
              onChange={(e) => setNewTask({...newTask, project: e.target.value})}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project._id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
            {location.state?.projectName && (
              <p style={{fontSize: '12px', color: '#10b981', margin: '4px 0 0 0'}}>
                ✓ Pre-selected from project detail page
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
              <option value="">Select subset</option>
              <option value="train">Train</option>
              <option value="test">Test</option>
              <option value="validation">Validation</option>
            </select>
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
              Labels
            </label>
            <p style={{color: '#6b7280', fontSize: '14px', margin: 0}}>
              Project labels will be used
            </p>
          </div>
        </div>

        {/* Select Files */}
        <div style={{marginBottom: '30px'}}>
          <h3 style={{marginBottom: '15px', fontSize: '18px', fontWeight: '600'}}>
            Select files <span style={{color: 'red'}}>*</span>
          </h3>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '10px'
          }}>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              My computer
            </button>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Connected file share
            </button>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Remote sources
            </button>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Cloud Storage
            </button>
          </div>

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
            {isSubmitting ? 'Creating...' : 'Submit'}
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
      <Header page="tasks" setPage={() => {}} />
      
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
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
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
              {searchTerm ? 'No tasks found' : 'No tasks yet'}
            </h3>
            <p style={{color: '#94a3b8', marginBottom: '24px'}}>
              {searchTerm ? 'Try a different search term' : 'Create your first task to get started'}
            </p>
            {!searchTerm && (
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
                key={task.id}
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
                  <button
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <MoreHorizontal size={20} color="#64748b" />
                  </button>
                </div>

                {/* Task Details */}
                <div style={{marginBottom: '16px'}}>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '8px'
                  }}>
                    <strong>Project:</strong> {task.project}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '8px'
                  }}>
                    <strong>Subset:</strong> {task.subset}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0
                  }}>
                    <strong>Images:</strong> {task.images}
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
                    <span style={{fontSize: '12px', color: '#64748b'}}>{task.progress}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${task.progress}%`,
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
                      }}>{task.createdAt}</p>
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
                      }}>{task.updatedAt}</p>
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
                    onClick={() => navigate(`/projects/${task.projectId}`)}
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
                    Open
                  </button>
                  <button
                    onClick={() => {
                      // Add edit functionality
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={16} color="#64748b" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id, task.name)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#fee2e2'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    title="Delete task"
                  >
                    <Trash2 size={16} color="#dc2626" />
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
