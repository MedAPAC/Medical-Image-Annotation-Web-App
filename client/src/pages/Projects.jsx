import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import Header from '../components/Header';
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  Trash2,
  Eye,
  Circle,
  RectangleHorizontal,
  Shapes,
  PenTool,
  Brush,
  X,
  Calendar,
  Clock,
  FolderOpen
} from 'lucide-react';

const Projects = () => {
  const { isAuthenticated, user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);
  
  const [projects, setProjects] = useState([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for editor mode (raw or constructor)
  const [editorMode, setEditorMode] = useState('constructor');
  
  // State for project name and labels
  const [projectName, setProjectName] = useState('');
  const [currentLabel, setCurrentLabel] = useState({
    name: '',
    type: 'rectangle',
    color: '#FF6B6B',
  });
  
  // State for current attribute
  const [currentAttribute, setCurrentAttribute] = useState({
    name: '',
    type: 'text',
    values: '',
    mutable: false
  });
  
  // Separate arrays for labels and attributes
  const [labels, setLabels] = useState([]);
  const [attributes, setAttributes] = useState([]);
  
  const [rawJsonContent, setRawJsonContent] = useState('{"labels":[],"attributes":[]}');
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [ownerEmails, setOwnerEmails] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedOwnerTeamIds, setSelectedOwnerTeamIds] = useState([]);
  const [description, setDescription] = useState('');

  const annotationTypes = [
    { value: "rectangle", label: "Rectangle", icon: RectangleHorizontal, color: "#3B82F6" },
    { value: "polygon", label: "Polygon", icon: Shapes, color: "#8B5CF6" },
    { value: "polyline", label: "Polyline", icon: PenTool, color: "#10B981" },
    { value: "ellipse", label: "Ellipse", icon: Circle, color: "#EF4444" },
    { value: "brush", label: "Brush", icon: Brush, color: "#84CC16" }  ];

  const attributeTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio" },
    { value: "select", label: "Select" }
  ];

  // Handler for switching editor mode
  const handleEditorModeChange = (mode) => {
    setEditorMode(mode);
  };

  const serializeProjectConfig = (nextLabels = labels, nextAttributes = attributes) => ({
    labels: nextLabels.map(label => ({
      id: label.id,
      name: label.name,
      type: label.type,
      color: label.color
    })),
    attributes: nextAttributes.map(attr => ({
      id: attr.id,
      name: attr.name,
      type: attr.type,
      values: attr.values,
      mutable: attr.mutable
    }))
  });

  const syncRawJsonFromState = (nextLabels = labels, nextAttributes = attributes) => {
    setRawJsonContent(JSON.stringify(serializeProjectConfig(nextLabels, nextAttributes), null, 2));
    setIsManualEdit(false);
  };

  const parseOwnerEmails = () => ownerEmails
    ? ownerEmails.split(',').map(email => email.trim()).filter(Boolean)
    : [];

  // Handler for adding a new label
  const handleAddLabel = () => {
    if (currentLabel.name.trim()) {
      const newLabel = {
        id: Date.now(),
        name: currentLabel.name.trim(),
        type: currentLabel.type,
        color: currentLabel.color
      };
      const nextLabels = [...labels, newLabel];
      setLabels(nextLabels);
      setCurrentLabel({
        name: '',
        type: 'rectangle',
        color: '#FF6B6B',
      });
      syncRawJsonFromState(nextLabels, attributes);
    }
  };

  // Handler for adding a new attribute
  const handleAddAttribute = () => {
    if (currentAttribute.name.trim()) {
      const newAttribute = {
        id: Date.now(),
        name: currentAttribute.name.trim(),
        type: currentAttribute.type,
        values: currentAttribute.values,
        mutable: currentAttribute.mutable
      };
      const nextAttributes = [...attributes, newAttribute];
      setAttributes(nextAttributes);
      setCurrentAttribute({
        name: '',
        type: 'text',
        values: '',
        mutable: false
      });
      syncRawJsonFromState(labels, nextAttributes);
    }
  };

  // Handler for updating current label
  const handleUpdateCurrentLabel = (field, value) => {
    setCurrentLabel({
      ...currentLabel,
      [field]: value
    });
  };

  // Handler for updating current attribute
  const handleUpdateCurrentAttribute = (field, value) => {
    setCurrentAttribute({
      ...currentAttribute,
      [field]: value
    });
  };

  // Handler for removing a label
  const handleRemoveLabel = (labelId) => {
    const nextLabels = labels.filter(label => label.id !== labelId);
    setLabels(nextLabels);
    syncRawJsonFromState(nextLabels, attributes);
  };

  // Handler for removing an attribute
  const handleRemoveAttribute = (attributeId) => {
    const nextAttributes = attributes.filter(attr => attr.id !== attributeId);
    setAttributes(nextAttributes);
    syncRawJsonFromState(labels, nextAttributes);
  };

  // Function to generate JSON from labels and attributes
  const generateJsonFromData = () => {
    syncRawJsonFromState(labels, attributes);
  };

  // Handler for Continue button
  const handleContinue = () => {
    if (!projectName.trim()) {
      alert('Please enter a project name first');
      return;
    }
    
    generateJsonFromData();
    setEditorMode('raw');
    alert('Data saved successfully! Check the Raw editor to see the JSON.');
  };

  // Handler for manual editing in raw editor
  const handleRawEditorChange = (e) => {
    setRawJsonContent(e.target.value);
    setIsManualEdit(true);
  };

  // Function to parse JSON from raw editor back to labels and attributes
  const parseJsonToData = () => {
    try {
      const parsedData = JSON.parse(rawJsonContent);
      
      // Parse labels
      if (parsedData.labels && Array.isArray(parsedData.labels)) {
        const newLabels = parsedData.labels.map((item, index) => ({
          id: Date.now() + index,
          name: item.name || '',
          type: item.type || 'rectangle',
          color: item.color || '#FF6B6B'
        }));
        setLabels(newLabels);
      } else {
        setLabels([]);
      }
      
      // Parse attributes
      if (parsedData.attributes && Array.isArray(parsedData.attributes)) {
        const newAttributes = parsedData.attributes.map((item, index) => ({
          id: Date.now() + 1000 + index,
          name: item.name || '',
          type: item.type || 'text',
          values: Array.isArray(item.values) ? item.values.join(', ') : (item.values || ''),
          mutable: item.mutable || false
        }));
        setAttributes(newAttributes);
      } else {
        setAttributes([]);
      }
      
      setIsManualEdit(false);
      alert('JSON parsed successfully! Switched to Constructor view.');
      setEditorMode('constructor');
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  // Handler for reset button
  const handleReset = () => {
    setRawJsonContent('{"labels":[],"attributes":[]}');
    setLabels([]);
    setAttributes([]);
    setIsManualEdit(false);
  };

  const closeCreateModal = () => {
    setSelectedOwnerTeamIds([]);
    setShowCreateModal(false);
  };
  
  // Prepare project data for submission
  const prepareProjectData = () => {
    const baseProjectData = {
      name: projectName,
      description: description || '',
      ownerEmails: parseOwnerEmails(),
      ownerTeamIds: selectedOwnerTeamIds
    };

    if (editorMode === 'raw' && isManualEdit) {
      try {
        const parsedData = JSON.parse(rawJsonContent);
        return {
          ...baseProjectData,
          labels: Array.isArray(parsedData.labels) ? parsedData.labels : [],
          attributes: Array.isArray(parsedData.attributes) ? parsedData.attributes : []
        };
      } catch (error) {
        throw new Error('Invalid raw JSON format. Apply or fix the JSON before creating the project.');
      }
    }

    return {
      ...baseProjectData,
      labels: labels.map(label => ({
        name: label.name,
        type: label.type,
        color: label.color
      })),
      attributes: attributes.map(attr => ({
        name: attr.name,
        type: attr.type,
        values: attr.values,
        mutable: attr.mutable
      }))
    };
  };
  
  // Handler for Submit & Continue
  const handleSubmitAndContinue = async () => {
    if (!projectName.trim()) {
      setSubmitError('Please enter a project name');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const projectData = prepareProjectData();

      await axios.post(
        'http://localhost:5000/api/projects',
        projectData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setSubmitSuccess('Project created successfully! You can create another one.');
      
      // Reset the form
      setProjectName('');
      setDescription('');
      setOwnerEmails('');
      setSelectedOwnerTeamIds([]);
      setLabels([]);
      setAttributes([]);
      setCurrentLabel({
        name: '',
        type: 'rectangle',
        color: '#FF6B6B'
      });
      setCurrentAttribute({
        name: '',
        type: 'text',
        values: '',
        mutable: false
      });
      setRawJsonContent('{"labels":[],"attributes":[]}');
      setIsManualEdit(false);
      
      // Reload projects
      loadProjects();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitError(error.response?.data?.error || error.message || 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for Submit & Open
  const handleSubmitAndOpen = async () => {
    if (!projectName.trim()) {
      setSubmitError('Please enter a project name');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const projectData = prepareProjectData();

      const response = await axios.post(
        'http://localhost:5000/api/projects',
        projectData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setSubmitSuccess('Project created successfully! Redirecting...');
      
      // Reload projects
      await loadProjects();
      
      // Navigate to the new project page
      if (response.data.project && response.data.project.id) {
        setTimeout(() => {
          navigate(`/projects/${response.data.project.id}`);
        }, 1000);
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitError(error.response?.data?.error || error.message || 'Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const loadProjects = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.projects) {
        const loadedProjects = response.data.projects.map(project => ({
          id: project._id,
          name: project.name,
          description: project.description || '',
          labels: project.labels || [],
          attributes: project.attributes || [],
          createdAt: new Date(project.createdAt).toISOString().split('T')[0],
          status: project.status || 'active',
          tasks: project.tasks || 0,
          progress: project.progress || 0,
          lastModified: new Date(project.updatedAt).toLocaleString(),
          owners: project.owners || [],
          ownerDetails: project.ownerDetails || []
        }));
        
        setProjects(loadedProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, [token]);

  const loadTeams = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setTeams(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading teams:', error);
      setTeams([]);
    }
  }, [token]);

  // Load existing projects on component mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && token) {
      loadProjects();
      loadTeams();
    }
  }, [authLoading, isAuthenticated, token, loadProjects, loadTeams]);

  const handleDeleteProject = async (projectId, projectName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      
      alert('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.response?.data?.error || 'Failed to delete project. Please try again.');
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ownedTeams = teams.filter(team =>
    String(team.createdBy || '') === String(user?.id || '') ||
    (team.createdByEmail && user?.email && team.createdByEmail.toLowerCase() === user.email.toLowerCase())
  );

  const handleOwnerTeamToggle = (teamId) => {
    setSelectedOwnerTeamIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'paused': return 'Paused';
      default: return 'Unknown';
    }
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
        fontSize: '15px',
        fontWeight: 600
      }}>
        Checking session...
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render create project modal
  const renderCreateProjectModal = () => (
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
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2>Create a new project</h2>
          <button 
            onClick={closeCreateModal}
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

        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <div style={{width: '100%'}}>
            <p>Name</p>
            <input 
              type="text" 
              placeholder="Enter project name" 
              style={{width: '100%', height:'30px', padding: '5px'}}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div style={{width: '100%'}}>
            <p>Description (Optional)</p>
            <textarea 
              placeholder="Enter project description"
              style={{width: '100%', padding: '5px', minHeight: '60px'}}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{width: '100%'}}>
            <p>Additional Owners (Optional)</p>
            <input 
              type="text" 
              placeholder="Enter comma-separated emails (user1@example.com, user2@example.com)"
              style={{width: '100%', height:'30px', padding: '5px'}}
              value={ownerEmails}
              onChange={(e) => setOwnerEmails(e.target.value)}
            />
            <small style={{color: '#666'}}>Note: You will always be an owner of the project.</small>
          </div>

          <div style={{width: '100%'}}>
            <p>Owner Teams (Optional)</p>
            {ownedTeams.length > 0 ? (
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '10px',
                maxHeight: '150px',
                overflowY: 'auto',
                backgroundColor: '#fff'
              }}>
                {ownedTeams.map(team => (
                  <label
                    key={team._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '8px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <input
                        type="checkbox"
                        checked={selectedOwnerTeamIds.includes(team._id)}
                        onChange={() => handleOwnerTeamToggle(team._id)}
                      />
                      <span style={{fontWeight: 500}}>{team.name}</span>
                    </span>
                    <span style={{fontSize: '12px', color: '#6b7280'}}>
                      {(team.members || []).length} members
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <small style={{color: '#666'}}>Create a team in the Teams page to add all team members as owners.</small>
            )}
            <small style={{display: 'block', color: '#666', marginTop: '4px'}}>
              Only teams you created can be selected. Their current members will be added as project owners.
            </small>
          </div>

          <div>
            <p>Labels & Attributes:</p>
            <div style={{display: 'flex', flexDirection: 'row', gap: '10px', marginBottom:'30px', borderBottom: '1px solid gray'}}>
              <button 
                onClick={() => handleEditorModeChange('raw')}
                style={{
                  padding: '10px', 
                  borderRadius: '10px', 
                  width:'100px',
                  backgroundColor: editorMode === 'raw' ? '#007bff' : '#f8f9fa',
                  color: editorMode === 'raw' ? 'white' : 'black',
                  border: '1px solid #dee2e6'
                }}
              >
                Raw
              </button>
              <button 
                onClick={() => handleEditorModeChange('constructor')}
                style={{
                  padding: '10px', 
                  borderRadius: '10px', 
                  width:'100px',
                  backgroundColor: editorMode === 'constructor' ? '#007bff' : '#f8f9fa',
                  color: editorMode === 'constructor' ? 'white' : 'black',
                  border: '1px solid #dee2e6'
                }}
              >
                Constructor
              </button>
            </div>
            {editorMode === 'raw' && (
              <div style={{marginBottom:'20px',width:'100%'}} className='raw_editor'>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                  <h4>Raw JSON Editor</h4>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button 
                      onClick={handleReset}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Reset
                    </button>
                    {isManualEdit && (
                      <button 
                        onClick={parseJsonToData}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Apply Changes
                      </button>
                    )}
                  </div>
                </div>
                <textarea 
                  name="" 
                  id="" 
                  cols="80" 
                  rows="12"
                  value={rawJsonContent}
                  onChange={handleRawEditorChange}
                  style={{
                    width: '100%', 
                    maxWidth: '100%',
                    minWidth: '100%',
                    fontFamily: 'monospace',
                    border: isManualEdit ? '2px solid #ffc107' : '1px solid #ccc',
                    resize: 'vertical',
                    overflow: 'auto',
                    boxSizing: 'border-box'
                  }}
                ></textarea>
                {isManualEdit && (
                  <p style={{color: '#ffc107', fontSize: '12px', marginTop: '5px'}}>
                    ⚠️ Manual edits detected. Click "Apply Changes" to update.
                  </p>
                )}
              </div>
            )}
            {editorMode === 'constructor' && (
              <>
                {/* Labels Section */}
                <div style={{marginBottom: '30px'}}>
                  <h3>Labels</h3>
                  <div style={{display:'flex', alignContent:'center', gap:'10px', width:'100%', margin:'0 auto 20px auto'}}>
                    <input 
                      type="text" 
                      placeholder="Enter label name" 
                      value={currentLabel.name}
                      onChange={(e) => handleUpdateCurrentLabel('name', e.target.value)}
                      style={{padding: '8px', flex: 1}}
                    />
                    <select 
                      name="labelType" 
                      id="labelType"
                      value={currentLabel.type}
                      onChange={(e) => handleUpdateCurrentLabel('type', e.target.value)}
                      style={{padding: '8px'}}
                    >
                      {annotationTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <input 
                      type="color" 
                      style={{height:'40px', width: '60px'}}
                      value={currentLabel.color}
                      onChange={(e) => handleUpdateCurrentLabel('color', e.target.value)}
                    />
                    <button 
                      onClick={handleAddLabel}
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Add Label
                    </button>
                  </div>
                  
                  {/* Display added labels */}
                  {labels.length > 0 && (
                    <div style={{marginBottom: '20px'}}>
                      <h4>Added Labels:</h4>
                      {labels.map((label) => (
                        <div key={label.id} style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '10px', 
                          backgroundColor: '#f0f0f0', 
                          marginBottom: '5px',
                          borderRadius: '5px'
                        }}>
                          <span style={{fontWeight: 'bold', flex: 1}}>{label.name}</span>
                          <span style={{color: '#666'}}>({label.type})</span>
                          <div style={{
                            width: '20px', 
                            height: '20px', 
                            backgroundColor: label.color, 
                            border: '1px solid #ccc'
                          }}></div>
                          <button 
                            onClick={() => handleRemoveLabel(label.id)}
                            style={{
                              backgroundColor: 'red', 
                              color: 'white', 
                              border: 'none', 
                              padding: '5px 10px', 
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attributes Section */}
                <div style={{marginBottom: '30px'}}>
                  <h3>Attributes</h3>
                  <div style={{display:'flex', alignContent:'center', gap:'10px', width:'100%', margin:'0 auto 20px auto', flexWrap: 'wrap'}}>
                    <input 
                      type="text" 
                      placeholder="Attribute name" 
                      value={currentAttribute.name}
                      onChange={(e) => handleUpdateCurrentAttribute('name', e.target.value)}
                      style={{padding: '8px', flex: 1}}
                    />
                    <select 
                      name="attributeType" 
                      id="attributeType"
                      value={currentAttribute.type}
                      onChange={(e) => handleUpdateCurrentAttribute('type', e.target.value)}
                      style={{padding: '8px', minWidth: '120px'}}
                    >
                      {attributeTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Values (comma separated for select/radio)"
                      value={currentAttribute.values}
                      onChange={(e) => handleUpdateCurrentAttribute('values', e.target.value)}
                      style={{padding: '8px', flex: 2}}
                    />
                    <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <input 
                        type="checkbox" 
                        id="mutableCheckbox"
                        checked={currentAttribute.mutable}
                        onChange={(e) => handleUpdateCurrentAttribute('mutable', e.target.checked)}
                      />
                      <label htmlFor="mutableCheckbox">Mutable</label>
                    </div>
                    <button 
                      onClick={handleAddAttribute}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Add Attribute
                    </button>
                  </div>
                  
                  {/* Display added attributes */}
                  {attributes.length > 0 && (
                    <div style={{marginBottom: '20px'}}>
                      <h4>Added Attributes:</h4>
                      {attributes.map((attr) => (
                        <div key={attr.id} style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '10px', 
                          backgroundColor: '#f8f9fa', 
                          marginBottom: '5px',
                          borderRadius: '5px',
                          border: '1px solid #dee2e6'
                        }}>
                          <span style={{fontWeight: 'bold', flex: 1}}>{attr.name}</span>
                          <span style={{color: '#666', minWidth: '80px'}}>({attr.type})</span>
                          <span style={{color: '#6c757d', flex: 2}}>Values: {attr.values || 'N/A'}</span>
                          <span style={{color: attr.mutable ? '#28a745' : '#dc3545', minWidth: '70px'}}>
                            {attr.mutable ? 'Mutable' : 'Immutable'}
                          </span>
                          <button 
                            onClick={() => handleRemoveAttribute(attr.id)}
                            style={{
                              backgroundColor: 'red', 
                              color: 'white', 
                              border: 'none', 
                              padding: '5px 10px', 
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div style={{display:'flex', alignContent:'center', gap:'20px', marginBottom:'20px'}}>
            <button 
              onClick={handleContinue}
              style={{backgroundColor:'blue', width:'100px', padding:'10px', color:'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Continue
            </button>
            <button 
              onClick={closeCreateModal}
              style={{backgroundColor:'red', width:'100px', padding:'10px', color:'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Cancel
            </button>
          </div>
          {/* Error and Success Messages */}
          {submitError && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '10px'
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
              marginBottom: '10px'
            }}>
              {submitSuccess}
            </div>
          )}

          <div style={{display:'flex', alignContent:'center', justifyContent:'end', gap:'20px', width:'100%'}}>
            <button 
              onClick={handleSubmitAndOpen}
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Open'}
            </button>
            <button 
              onClick={handleSubmitAndContinue}
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="projects-page enterprise-page" style={{
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
            }}>My Projects</h1>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: 0
            }}>
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
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
            Create New Project
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
              placeholder="Search projects..."
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

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <FolderOpen size={64} style={{color: '#cbd5e1', marginBottom: '16px'}} />
            <h3 style={{color: '#475569', marginBottom: '8px'}}>
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p style={{color: '#94a3b8', marginBottom: '24px'}}>
              {searchTerm ? 'Try a different search term' : 'Create your first project to get started'}
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
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
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
                {/* Project Header */}
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
                    }}>{project.name}</h3>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: project.status === 'active' ? '#dcfce7' : '#dbeafe',
                      color: project.status === 'active' ? '#166534' : '#1e40af'
                    }}>
                      {getStatusText(project.status)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.name);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <Trash2 size={20} color="#dc2626" />
                  </button>
                </div>

                {/* Project Description */}
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '16px',
                  lineHeight: '1.5',
                  minHeight: '42px'
                }}>
                  {project.description || 'No description provided'}
                </p>

                {/* Labels */}
                {project.labels && project.labels.length > 0 && (
                  <div style={{marginBottom: '12px'}}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#475569',
                      marginBottom: '8px'
                    }}>Labels ({project.labels.length})</p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {project.labels.slice(0, 3).map((label, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#475569'
                          }}
                        >
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: label.color || '#94a3b8'
                          }} />
                          {label.name}
                        </span>
                      ))}
                      {project.labels.length > 3 && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#475569'
                        }}>
                          +{project.labels.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Attributes */}
                {project.attributes && project.attributes.length > 0 && (
                  <div style={{marginBottom: '16px'}}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#475569',
                      marginBottom: '8px'
                    }}>Attributes ({project.attributes.length})</p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {project.attributes.slice(0, 3).map((attr, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#e0f2fe',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#0369a1'
                          }}
                        >
                          {attr.name} ({attr.type})
                        </span>
                      ))}
                      {project.attributes.length > 3 && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#e0f2fe',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#0369a1'
                        }}>
                          +{project.attributes.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Owners */}
                {project.ownerDetails && project.ownerDetails.length > 0 && (
                  <div style={{marginBottom: '12px'}}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#475569',
                      marginBottom: '8px'
                    }}>Owners ({project.ownerDetails.length})</p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {project.ownerDetails.slice(0, 3).map((owner, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#92400e'
                          }}
                        >
                          {owner.name || owner.email}
                        </span>
                      ))}
                      {project.ownerDetails.length > 3 && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#92400e'
                        }}>
                          +{project.ownerDetails.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Project Stats */}
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
                      }}>{project.createdAt}</p>
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
                      }}>{project.lastModified}</p>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && renderCreateProjectModal()}
    </div>
  );
};

export default Projects;
