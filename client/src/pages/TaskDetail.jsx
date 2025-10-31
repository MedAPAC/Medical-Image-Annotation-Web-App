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
  X
} from 'lucide-react';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTaskName, setEditingTaskName] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [subset, setSubset] = useState('');
  const [state, setState] = useState('new');

  // Redirect if not authenticated
  useEffect(() => {
    // Temporarily disabled for testing
    // if (!isAuthenticated) {
    //   navigate('/login');
    // }
  }, [isAuthenticated, navigate]);

  // Load task data
  useEffect(() => {
    const loadTask = () => {
      try {
        const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const taskIdNum = parseInt(taskId);
        const taskData = savedTasks.find(t => t.id === taskIdNum || t.id.toString() === taskId);
        
        if (taskData) {
          setTask(taskData);
          setTaskName(taskData.name);
          setAssignedTo(taskData.assignedTo || '');
          setSubset(taskData.subset || '');
          setState(taskData.state || 'new');
        } else {
          alert('Task not found');
          navigate('/tasks');
        }
      } catch (error) {
        console.error('Error loading task:', error);
        alert('Error loading task');
        navigate('/tasks');
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }
  }, [taskId, navigate]);

  // Listen for task updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const taskIdNum = parseInt(taskId);
      const taskData = savedTasks.find(t => t.id === taskIdNum || t.id.toString() === taskId);
      if (taskData) {
        setTask(taskData);
        setTaskName(taskData.name);
        setAssignedTo(taskData.assignedTo || '');
        setSubset(taskData.subset || '');
        setState(taskData.state || 'new');
      }
    };

    window.addEventListener('taskUpdated', handleTaskUpdate);
    return () => window.removeEventListener('taskUpdated', handleTaskUpdate);
  }, [taskId]);

  const handleUpdateTaskName = () => {
    if (!taskName.trim()) {
      alert('Task name cannot be empty');
      return;
    }

    const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = savedTasks.map(t => 
      t.id === parseInt(taskId) ? { ...t, name: taskName } : t
    );
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    setTask({ ...task, name: taskName });
    setEditingTaskName(false);
    window.dispatchEvent(new CustomEvent('taskUpdated'));
  };

  const handleUpdateAssignedTo = (email) => {
    if (!task) return;
    
    const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIdNum = parseInt(taskId);
    const updatedTasks = savedTasks.map(t => {
      const taskIdMatch = t.id === taskIdNum || t.id.toString() === taskId;
      return taskIdMatch ? { ...t, assignedTo: email } : t;
    });
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    const updatedTask = { ...task, assignedTo: email };
    setTask(updatedTask);
    setAssignedTo(email);
    window.dispatchEvent(new CustomEvent('taskUpdated'));
  };

  const handleUpdateSubset = (newSubset) => {
    if (!task) return;
    
    const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIdNum = parseInt(taskId);
    const updatedTasks = savedTasks.map(t => {
      const taskIdMatch = t.id === taskIdNum || t.id.toString() === taskId;
      return taskIdMatch ? { ...t, subset: newSubset } : t;
    });
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    const updatedTask = { ...task, subset: newSubset };
    setTask(updatedTask);
    setSubset(newSubset);
    window.dispatchEvent(new CustomEvent('taskUpdated'));
  };

  const handleUpdateState = (newState) => {
    if (!task) return;
    
    const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIdNum = parseInt(taskId);
    const updatedTasks = savedTasks.map(t => {
      const taskIdMatch = t.id === taskIdNum || t.id.toString() === taskId;
      return taskIdMatch ? { ...t, state: newState } : t;
    });
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    const updatedTask = { ...task, state: newState };
    setTask(updatedTask);
    setState(newState);
    window.dispatchEvent(new CustomEvent('taskUpdated'));
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'new': return '#3b82f6';
      case 'in progress': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'completed': return '#8b5cf6';
      default: return '#6b7280';
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

  if (!task) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div>Task not found</div>
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
        {/* Back to Project Link */}
        <div style={{ marginBottom: '20px' }}>
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
            Back to project
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
              <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
                Task #{task.id} Created by {task.createdBy || user?.email || 'Unknown'} on {task.createdAt}
              </p>
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
                    handleUpdateAssignedTo(email);
                  }}
                  onBlur={(e) => {
                    handleUpdateAssignedTo(e.target.value);
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

          {/* Subset and State Fields */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Subset
              </label>
              <select
                value={subset}
                onChange={(e) => {
                  setSubset(e.target.value);
                  handleUpdateSubset(e.target.value);
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  width: '200px'
                }}
              >
                <option value="train">Train</option>
                <option value="test">Test</option>
                <option value="validation">Validation</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                State
              </label>
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  handleUpdateState(e.target.value);
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  width: '200px',
                  color: getStateColor(state)
                }}
              >
                <option value="new" style={{ color: '#3b82f6' }}>New</option>
                <option value="in progress" style={{ color: '#10b981' }}>In Progress</option>
                <option value="rejected" style={{ color: '#ef4444' }}>Rejected</option>
                <option value="completed" style={{ color: '#8b5cf6' }}>Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
