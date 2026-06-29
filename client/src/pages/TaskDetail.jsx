import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import Header from '../components/Header';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  File,
  FileText,
  Folder,
  Layers,
  Plus,
  Target,
  Trash2,
  UploadCloud,
  User,
  X
} from 'lucide-react';
import '../styles/TaskDetail.css';

import { API_BASE_URL, taskFileContentUrl } from '../config/api';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token, loading: authLoading } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const [editingTaskName, setEditingTaskName] = useState(false);
  const [taskName, setTaskName] = useState('');

  const [assignees, setAssignees] = useState([]);
  const [newAssigneeInput, setNewAssigneeInput] = useState('');

  const [subset, setSubset] = useState('train');
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');

  const [files, setFiles] = useState([]);
  const [projectsList, setProjectsList] = useState([]);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filePendingDelete, setFilePendingDelete] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !isAuthenticated || !taskId || !token) return;

      try {
        setLoading(true);
        setError('');

        const [taskResponse, projectsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/tasks/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/projects`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (taskResponse.data.task) {
          const taskData = taskResponse.data.task;
          setTask(taskData);
          setTaskName(taskData.name || '');

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
        console.error('Error loading task details:', err);
        setError(err.response?.data?.error || 'Error loading task details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated, taskId, token]);

  const showNotice = (type, text) => {
    setNotice({ type, text });
  };

  const handleUpdateTask = async (updates, successMessage) => {
    if (!task || !token) return false;

    try {
      setIsUpdating(true);
      setNotice(null);
      const response = await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.task) {
        setTask((prev) => {
          const nextTask = response.data.task;
          if (updates.projectId) {
            const newProject = projectsList.find((project) => project._id === updates.projectId);
            return {
              ...nextTask,
              projectName: newProject?.name || nextTask.projectName || prev?.projectName
            };
          }
          return nextTask;
        });
        if (successMessage) {
          showNotice('success', successMessage);
        }
        return true;
      }
    } catch (err) {
      console.error('Error updating task:', err);
      showNotice('error', err.response?.data?.error || 'Failed to update task.');
    } finally {
      setIsUpdating(false);
    }

    return false;
  };

  const handleUpdateTaskName = async () => {
    if (!taskName.trim()) {
      showNotice('error', 'Task name cannot be empty.');
      return;
    }

    if (await handleUpdateTask({ name: taskName.trim() }, 'Task name updated.')) {
      setEditingTaskName(false);
    }
  };

  const handleUpdateProjectId = async (newId) => {
    if (await handleUpdateTask({ projectId: newId }, 'Task project updated.')) {
      setProjectId(newId);
    }
  };

  const validateAssigneeEmail = (email) => {
    if (!email) return { valid: true, message: '' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address.' };
    }

    return { valid: true, message: '' };
  };

  const syncAssignees = async (newList, successMessage) => {
    try {
      setIsUpdating(true);
      setNotice(null);
      const response = await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}/assign`,
        { assigneeEmails: newList },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.task) {
        setAssignees(response.data.task.assignees || []);
        setTask(response.data.task);
        if (successMessage) {
          showNotice('success', successMessage);
        }
      }
    } catch (err) {
      console.error('Error updating assignees:', err);
      showNotice('error', err.response?.data?.error || 'Failed to update assignees.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAssignee = async () => {
    const email = newAssigneeInput.trim();
    const validation = validateAssigneeEmail(email);

    if (!email || !validation.valid) {
      showNotice('error', validation.message || 'Please enter a valid email address.');
      return;
    }

    if (assignees.includes(email)) {
      setNewAssigneeInput('');
      return;
    }

    await syncAssignees([...assignees, email], 'Assignee added.');
    setNewAssigneeInput('');
  };

  const handleRemoveAssignee = async (emailToRemove) => {
    await syncAssignees(
      assignees.filter((email) => email !== emailToRemove),
      'Assignee removed.'
    );
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      setIsUploading(true);
      setNotice(null);
      const response = await axios.post(
        `${API_BASE_URL}/api/tasks/${taskId}/files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.files) {
        setFiles((prev) => [...prev, ...response.data.files]);
        setTask((prev) => ({
          ...prev,
          totalItems: (prev.totalItems || 0) + response.data.files.length
        }));
        showNotice('success', `${response.data.files.length} file(s) uploaded.`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      showNotice('error', err.response?.data?.error || 'Failed to upload files.');
    } finally {
      setIsUploading(false);
      event.target.value = null;
    }
  };

  const handleDeleteFile = async () => {
    if (!filePendingDelete) return;

    const fileId = filePendingDelete._id || filePendingDelete.id;
    if (!fileId) {
      showNotice('error', 'File ID is missing.');
      setFilePendingDelete(null);
      return;
    }

    try {
      setIsUpdating(true);
      setNotice(null);
      await axios.delete(`${API_BASE_URL}/api/tasks/${taskId}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFiles((prevFiles) => prevFiles.filter((file) => (file._id || file.id) !== fileId));
      setTask((prev) => ({
        ...prev,
        totalItems: Math.max((prev.totalItems || 1) - 1, 0)
      }));
      showNotice('success', 'File deleted.');
      setFilePendingDelete(null);
    } catch (err) {
      console.error('Error deleting file:', err);
      showNotice('error', err.response?.data?.error || 'Failed to delete file.');
      setFilePendingDelete(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileDownload = async (file) => {
    const fileId = file._id || file.id || file.filename;
    const filename = file.originalName || file.filename;
    if (!fileId || !filename) {
      showNotice('error', 'File download path is missing.');
      return;
    }
    try {
      const response = await axios.get(taskFileContentUrl(taskId, fileId, true), {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      showNotice('error', downloadError.response?.data?.error || 'Failed to download file.');
    }
  };

  const handleUpdateSubset = async (value) => {
    if (await handleUpdateTask({ subset: value }, 'Task subset updated.')) setSubset(value);
  };

  const handleUpdateStatus = async (value) => {
    if (await handleUpdateTask({ status: value }, 'Task status updated.')) setStatus(value);
  };

  const handleUpdateProgress = async (value) => {
    if (await handleUpdateTask({ progress: value }, 'Task progress updated.')) setProgress(value);
  };

  const handleUpdateDescription = async () => {
    if (await handleUpdateTask({ description }, 'Task description updated.')) {
      setIsEditingDescription(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (size) => {
    if (!Number.isFinite(size)) return 'Unknown size';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusLabel = (value) => String(value || 'pending').replace('_', ' ');

  const getStatusTone = (value) => {
    switch (value) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'active';
      case 'rejected':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getProgressTone = (value) => {
    if (value < 30) return 'danger';
    if (value < 70) return 'warning';
    return 'success';
  };

  const selectedProject = projectsList.find((project) => project._id === projectId);

  if (authLoading) {
    return (
      <div className="td-loading">
        <div className="td-spinner" />
        <span>Checking session...</span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="td-loading">
        <div className="td-spinner" />
        <span>Loading task...</span>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="td-error">
        <AlertCircle size={42} />
        <h3>{error || 'Task not found'}</h3>
        <button onClick={() => navigate('/tasks')} className="td-button td-button-secondary">
          <ArrowLeft size={16} />
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="td-page enterprise-page">
      <Header page="tasks" />

      <main className="td-shell">
        <div className="td-toolbar">
          <button onClick={() => navigate('/tasks')} className="td-back-button">
            <ArrowLeft size={16} />
            All Tasks
          </button>

          <div className="td-toolbar-actions">
            {task.projectId && (
              <button onClick={() => navigate(`/projects/${task.projectId}`)} className="td-button td-button-secondary">
                <Folder size={16} />
                View Project
              </button>
            )}
            <button onClick={() => navigate(`/annotation/${taskId}`)} className="td-button td-button-primary" disabled={isUpdating}>
              <Target size={16} />
              Open for Annotation
            </button>
          </div>
        </div>

        {notice && (
          <div className={`td-notice td-notice-${notice.type}`}>
            {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notice.text}</span>
          </div>
        )}

        <section className="td-hero">
          <div className="td-hero-main">
            <div className="td-kicker">Task workspace</div>

            {editingTaskName ? (
              <div className="td-title-edit">
                <input
                  type="text"
                  value={taskName}
                  onChange={(event) => setTaskName(event.target.value)}
                  className="td-title-input"
                  autoFocus
                />
                <div className="td-inline-actions">
                  <button onClick={handleUpdateTaskName} className="td-icon-button success" disabled={isUpdating} title="Save task name">
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setTaskName(task.name || '');
                      setEditingTaskName(false);
                    }}
                    className="td-icon-button"
                    title="Cancel editing"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="td-title-row">
                <h1>{task.name}</h1>
                <button onClick={() => setEditingTaskName(true)} className="td-icon-button" title="Edit task name">
                  <Edit3 size={18} />
                </button>
              </div>
            )}

            <p className="td-hero-copy">
              Review assignment, progress, configuration, files, and annotation entry points from one focused task page.
            </p>

            <div className="td-meta-row">
              <span>
                <User size={14} />
                Created by {task.createdBy || user?.email || 'Unknown'}
              </span>
              <span>
                <Calendar size={14} />
                {formatDate(task.createdAt)}
              </span>
              <span>
                <Folder size={14} />
                {selectedProject?.name || task.projectName || 'No Project'}
              </span>
            </div>
          </div>

          <aside className="td-assignment-card">
            <div className="td-section-heading compact">
              <div>
                <h2>Assigned people</h2>
                <p>{assignees.length} active assignee{assignees.length === 1 ? '' : 's'}</p>
              </div>
            </div>

            <div className="td-assignee-list">
              {assignees.length > 0 ? (
                assignees.map((email) => (
                  <div key={email} className="td-assignee-pill">
                    <span>
                      <User size={13} />
                      {email}
                    </span>
                    <button
                      onClick={() => handleRemoveAssignee(email)}
                      disabled={isUpdating}
                      title="Remove assignee"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="td-empty-inline">No assignees yet.</div>
              )}
            </div>

            <div className="td-add-assignee">
              <input
                type="email"
                placeholder="Add user by email"
                value={newAssigneeInput}
                onChange={(event) => setNewAssigneeInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleAddAssignee()}
              />
              <button onClick={handleAddAssignee} disabled={isUpdating} title="Add assignee">
                <Plus size={16} />
              </button>
            </div>
          </aside>
        </section>

        <section className="td-stats">
          <article className="td-stat-card">
            <div className="td-stat-icon">
              <File size={22} />
            </div>
            <div>
              <strong>{files.length}</strong>
              <span>Total files</span>
            </div>
          </article>

          <article className={`td-stat-card ${getStatusTone(status)}`}>
            <div className="td-stat-icon">
              <Clock3 size={22} />
            </div>
            <div>
              <strong>{getStatusLabel(status)}</strong>
              <span>Status</span>
            </div>
          </article>

          <article className={`td-stat-card ${getProgressTone(progress)}`}>
            <div className="td-stat-icon">
              <BarChart3 size={22} />
            </div>
            <div>
              <strong>{progress}%</strong>
              <span>Completion</span>
            </div>
          </article>

          <article className="td-stat-card">
            <div className="td-stat-icon">
              <Layers size={22} />
            </div>
            <div>
              <strong>{subset}</strong>
              <span>Dataset subset</span>
            </div>
          </article>
        </section>

        <section className="td-grid">
          <div className="td-column">
            <article className="td-panel">
              <div className="td-section-heading">
                <div>
                  <h2>
                    <Target size={18} />
                    Progress
                  </h2>
                  <p>Update task completion in quick checkpoints.</p>
                </div>
              </div>

              <div className="td-progress-block">
                <div className="td-progress-bar" aria-label={`Progress ${progress}%`}>
                  <div className={`td-progress-fill ${getProgressTone(progress)}`} style={{ width: `${progress}%` }} />
                </div>
                <div className="td-progress-steps">
                  {[0, 25, 50, 75, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleUpdateProgress(value)}
                      className={value === progress ? 'active' : ''}
                      disabled={isUpdating}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="td-panel">
              <div className="td-section-heading">
                <div>
                  <h2>
                    <Layers size={18} />
                    Configuration
                  </h2>
                  <p>Keep project, subset, and status aligned with the workflow.</p>
                </div>
              </div>

              <div className="td-field-grid">
                <label className="td-field">
                  <span>Project</span>
                  <select value={projectId} onChange={(event) => handleUpdateProjectId(event.target.value)} disabled={isUpdating}>
                    <option value="" disabled>Select Project</option>
                    {projectsList.map((project) => (
                      <option key={project._id} value={project._id}>{project.name}</option>
                    ))}
                  </select>
                </label>

                <label className="td-field">
                  <span>Subset</span>
                  <select value={subset} onChange={(event) => handleUpdateSubset(event.target.value)} disabled={isUpdating}>
                    <option value="train">Train</option>
                    <option value="test">Test</option>
                    <option value="validation">Validation</option>
                  </select>
                </label>

                <label className="td-field">
                  <span>Status</span>
                  <select value={status} onChange={(event) => handleUpdateStatus(event.target.value)} disabled={isUpdating}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              </div>
            </article>
          </div>

          <div className="td-column">
            <article className="td-panel">
              <div className="td-section-heading">
                <div>
                  <h2>
                    <FileText size={18} />
                    Description
                  </h2>
                  <p>Document task context for annotators and reviewers.</p>
                </div>

                {!isEditingDescription ? (
                  <button onClick={() => setIsEditingDescription(true)} className="td-button td-button-secondary small">
                    <Edit3 size={15} />
                    Edit
                  </button>
                ) : (
                  <div className="td-inline-actions">
                    <button onClick={handleUpdateDescription} className="td-button td-button-primary small" disabled={isUpdating}>
                      <Check size={15} />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setDescription(task.description || '');
                        setIsEditingDescription(false);
                      }}
                      className="td-button td-button-secondary small"
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingDescription ? (
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="td-description-editor"
                  rows={6}
                  placeholder="Add a clear task description..."
                />
              ) : (
                <div className="td-description-content">
                  {description || 'No description provided.'}
                </div>
              )}
            </article>

            <article className="td-panel">
              <div className="td-section-heading">
                <div>
                  <h2>
                    <File size={18} />
                    Files ({files.length})
                  </h2>
                  <p>Manage task input files used by the annotation workspace.</p>
                </div>

                <label className={`td-button td-button-secondary small ${isUploading ? 'disabled' : ''}`}>
                  <UploadCloud size={15} />
                  {isUploading ? 'Uploading...' : 'Add Files'}
                  <input type="file" multiple onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>

              {files.length > 0 ? (
                <div className="td-files-list">
                  {files.map((file, index) => (
                    <div key={file._id || file.id || index} className="td-file-item">
                      <div className="td-file-icon">
                        <File size={18} />
                      </div>
                      <div className="td-file-info">
                        <strong>{file.originalName || file.filename || 'Unnamed file'}</strong>
                        <span>
                          {(file.type || 'file').toUpperCase()} · {formatFileSize(file.size)}
                        </span>
                      </div>
                      <div className="td-file-actions">
                        <button onClick={() => handleFileDownload(file)} title="Download file">
                          <Download size={16} />
                        </button>
                        <button onClick={() => setFilePendingDelete(file)} className="danger" title="Delete file">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="td-empty-state">
                  <File size={28} />
                  <strong>No files attached</strong>
                  <span>Add image, DICOM, or NIfTI files to begin annotation.</span>
                </div>
              )}
            </article>
          </div>
        </section>
      </main>

      {filePendingDelete && (
        <div className="td-modal-backdrop">
          <div className="td-modal">
            <div className="td-modal-icon danger">
              <Trash2 size={24} />
            </div>
            <h2>Delete file</h2>
            <p>
              Delete <strong>{filePendingDelete.originalName || filePendingDelete.filename}</strong> from this task?
              This action cannot be undone.
            </p>
            <div className="td-modal-actions">
              <button onClick={() => setFilePendingDelete(null)} className="td-button td-button-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteFile} className="td-button td-button-danger" disabled={isUpdating}>
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
