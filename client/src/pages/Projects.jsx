import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  User
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

const Projects = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Medical Image Annotation Project",
      description: "Brain MRI segmentation project for tumor detection and analysis",
      labels: [
        { name: "Tumor", type: "polygon", color: "#FF6B6B" },
        { name: "Normal Tissue", type: "rectangle", color: "#4ECDC4" },
        { name: "Blood Vessel", type: "polyline", color: "#45B7D1" },
        { name: "Lesion", type: "ellipse", color: "#96CEB4" }
      ],
      createdAt: "2024-01-15",
      status: "active",
      tasks: 12,
      progress: 75,
      lastModified: "2 hours ago"
    }
    // {
    //   id: 2,
    //   name: "CT Scan Analysis",
    //   description: "Chest CT scan analysis for COVID-19 detection and lung assessment",
    //   labels: [
    //     { name: "Lung", type: "polygon", color: "#FFEAA7" },
    //     { name: "Infection", type: "mask", color: "#DDA0DD" }
    //   ],
    //   createdAt: "2024-01-10",
    //   status: "active",
    //   tasks: 8,
    //   progress: 45,
    //   lastModified: "1 day ago"
    // },
    // {
    //   id: 3,
    //   name: "X-Ray Classification",
    //   description: "Bone fracture detection and classification system",
    //   labels: [
    //     { name: "Fracture", type: "rectangle", color: "#98D8C8" },
    //     { name: "Normal Bone", type: "polygon", color: "#F7DC6F" }
    //   ],
    //   createdAt: "2024-01-05",
    //   status: "completed",
    //   tasks: 15,
    //   progress: 100,
    //   lastModified: "3 days ago"
    // }
  ]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  
  // New project form state
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    labels: []
  });
  
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [labelMode, setLabelMode] = useState("constructor");
  
  // State for dynamic attribute containers
  const [attributeContainers, setAttributeContainers] = useState([]);
  
  // State for editor mode (raw or constructor)
  const [editorMode, setEditorMode] = useState('raw');
  
  // State for project name and labels
  const [projectName, setProjectName] = useState('');
  const [currentLabel, setCurrentLabel] = useState({
    name: '',
    type: 'rectangle',
    color: '#FF6B6B',
    attributes: []
  });
  const [labels, setLabels] = useState([]);
  const [rawJsonContent, setRawJsonContent] = useState('[]');
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const annotationTypes = [
    { value: "rectangle", label: "Rectangle", icon: RectangleHorizontal, color: "#3B82F6" },
    { value: "polygon", label: "Polygon", icon: Shapes, color: "#8B5CF6" },
    { value: "polyline", label: "Polyline", icon: PenTool, color: "#10B981" },
    { value: "points", label: "Points", icon: Circle, color: "#F59E0B" },
    { value: "ellipse", label: "Ellipse", icon: Circle, color: "#EF4444" },
    { value: "cuboid", label: "Cuboid", icon: Box, color: "#06B6D4" },
    { value: "mask", label: "Mask", icon: Brush, color: "#84CC16" },
    { value: "tag", label: "Tag", icon: Tag, color: "#FF9F43" }
  ];

  const attributeTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio" },
    { value: "select", label: "Select" },
    { value: "date", label: "Date" }
  ];

  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", 
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
    "#FF9F43", "#10AC84", "#5F27CD", "#00D2D3", "#FF9FF3"
  ];

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      const project = {
        id: Date.now(),
        ...newProject,
        createdAt: new Date().toISOString().split('T')[0],
        status: "active",
        tasks: 0,
        progress: 0,
        lastModified: "Just now"
      };
      setProjects([...projects, project]);
      setNewProject({ name: "", description: "", labels: [] });
      setShowCreateModal(false);
    }
  };


  const handleAddAttribute = () => {
    const newAttribute = {
      id: Date.now(),
      name: "",
      type: "text",
      values: [],
      mutable: true
    };
    setCurrentLabel({
      ...currentLabel,
      attributes: [...currentLabel.attributes, newAttribute]
    });
  };

  const handleUpdateAttribute = (attributeId, field, value) => {
    setCurrentLabel({
      ...currentLabel,
      attributes: currentLabel.attributes.map(attr =>
        attr.id === attributeId ? { ...attr, [field]: value } : attr
      )
    });
  };

  const handleRemoveAttribute = (attributeId) => {
    setCurrentLabel({
      ...currentLabel,
      attributes: currentLabel.attributes.filter(attr => attr.id !== attributeId)
    });
  };

  // Handler for adding new attribute container
  const handleAddAttributeContainer = () => {
    const newContainer = {
      id: Date.now(),
      name: '',
      type: 'select',
      values: '',
      mutable: false
    };
    setCurrentLabel({
      ...currentLabel,
      attributes: [...currentLabel.attributes, newContainer]
    });
  };

  // Handler for updating attribute container values
  const handleUpdateAttributeContainer = (containerId, field, value) => {
    setCurrentLabel({
      ...currentLabel,
      attributes: currentLabel.attributes.map(container => {
        if (container.id === containerId) {
          const updatedContainer = { ...container, [field]: value };
          
          // Set default value when type changes to checkbox
          if (field === 'type' && value === 'checkbox' && !container.values) {
            updatedContainer.values = 'false';
          }
          
          return updatedContainer;
        }
        return container;
      })
    });
  };

  // Handler for deleting attribute container
  const handleDeleteAttributeContainer = (containerId) => {
    setCurrentLabel({
      ...currentLabel,
      attributes: currentLabel.attributes.filter(container => container.id !== containerId)
    });
  };

  // Handler for switching editor mode
  const handleEditorModeChange = (mode) => {
    setEditorMode(mode);
  };

  // Helper function to format attribute values based on input type
  const formatAttributeValues = (attr) => {
    switch (attr.type.toLowerCase()) {
      case 'radio':
      case 'select':
        // Radio/Select: comma-separated values
        return attr.values ? attr.values.split(',').map(v => v.trim()).filter(v => v) : [];
      
      case 'checkbox':
        // Checkbox: store true/false as text in values
        return attr.values ? [attr.values.trim()] : [];
      
      case 'text':
        // Text: single text value
        return attr.values ? [attr.values.trim()] : [];
      
      case 'number':
        // Number: format as min,max,step
        const numberParts = attr.values ? attr.values.split(',').map(v => v.trim()) : [];
        return numberParts.length >= 3 ? numberParts : ['0', '100', '1'];
      
      default:
        return attr.values ? attr.values.split(',').map(v => v.trim()).filter(v => v) : [];
    }
  };

  // Helper function to get default value based on input type
  const getDefaultValue = (attr) => {
    switch (attr.type.toLowerCase()) {
      case 'radio':
      case 'select':
        // Radio/Select: first value as default
        const values = attr.values ? attr.values.split(',').map(v => v.trim()).filter(v => v) : [];
        return values[0] || '';
      
      case 'checkbox':
        // Checkbox: true/false as default
        return attr.values === 'true' ? 'true' : 'false';
      
      case 'text':
        // Text: the text value itself
        return attr.values || '';
      
      case 'number':
        // Number: min value as default
        const numberParts = attr.values ? attr.values.split(',').map(v => v.trim()) : [];
        return numberParts[0] || '0';
      
      default:
        return attr.values || '';
    }
  };


  // Function to generate JSON from labels and attributes
  const generateJsonFromLabels = () => {
    if (!projectName.trim()) {
      setRawJsonContent('[]');
      return;
    }

    const jsonData = labels.map(label => ({
      name: label.name,
      type: label.type,
      attributes: label.attributes
        .filter(attr => attr.name.trim()) // Only include attributes with names
        .map(attr => ({
          name: attr.name,
          input_type: attr.type,
          mutable: attr.mutable,
          values: formatAttributeValues(attr),
          default_value: getDefaultValue(attr)
        }))
    }));

    setRawJsonContent(JSON.stringify(jsonData, null, 2));
  };

  // Handler for adding a new label
  const handleAddLabel = () => {
    if (currentLabel.name.trim()) {
      const newLabel = {
        id: Date.now(),
        ...currentLabel
      };
      setLabels([...labels, newLabel]);
      setCurrentLabel({
        name: '',
        type: 'rectangle',
        color: '#FF6B6B',
        attributes: []
      });
      // Generate JSON after adding label
      setTimeout(() => generateJsonFromLabels(), 100);
    }
  };

  // Handler for updating current label
  const handleUpdateCurrentLabel = (field, value) => {
    setCurrentLabel({
      ...currentLabel,
      [field]: value
    });
  };

  // Handler for removing a label
  const handleRemoveLabel = (labelId) => {
    setLabels(labels.filter(label => label.id !== labelId));
    // Generate JSON after removing label
    setTimeout(() => generateJsonFromLabels(), 100);
  };

  // Update JSON when project name or labels change (but not during manual editing)
  React.useEffect(() => {
    if (!isManualEdit) {
      generateJsonFromLabels();
    }
  }, [projectName, labels]);

  // Load projects function
  const loadProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      
      if (response.data.projects) {
        // Transform the loaded projects to match the expected format
        const loadedProjects = response.data.projects.map(project => ({
          id: project._id,
          name: project.name,
          description: project.description || '',
          labels: project.labels || [],
          createdAt: new Date(project.createdAt).toISOString().split('T')[0],
          status: project.status || 'active',
          tasks: project.tasks || 0,
          progress: project.progress || 0,
          lastModified: new Date(project.updatedAt).toLocaleString()
        }));
        
        setProjects(loadedProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  // Load existing projects on component mount
  React.useEffect(() => {
    loadProjects();
  }, []);

  // Handler for Continue button
  const handleContinue = () => {
    if (!projectName.trim()) {
      alert('Please enter a project name first');
      return;
    }
    
    // If there's a current label being worked on, add it to the labels array first
    if (currentLabel.name.trim()) {
      const newLabel = {
        id: Date.now(),
        ...currentLabel
      };
      setLabels([...labels, newLabel]);
      
      // Reset current label
      setCurrentLabel({
        name: '',
        type: 'rectangle',
        color: '#FF6B6B',
        attributes: []
      });
    }
    
    if (labels.length === 0 && !currentLabel.name.trim()) {
      alert('Please add at least one label');
      return;
    }
    
    // Generate and save JSON to raw textarea
    setTimeout(() => {
      generateJsonFromLabels();
      setIsManualEdit(false); // Reset manual edit flag
      // Switch to raw editor to show the JSON
      setEditorMode('raw');
      alert('Labels saved successfully! Check the Raw editor to see the JSON.');
    }, 100);
  };

  // Handler for manual editing in raw editor
  const handleRawEditorChange = (e) => {
    setRawJsonContent(e.target.value);
    setIsManualEdit(true);
  };

  // Function to parse JSON from raw editor back to labels
  const parseJsonToLabels = () => {
    try {
      const parsedData = JSON.parse(rawJsonContent);
      if (Array.isArray(parsedData)) {
        const newLabels = parsedData.map((item, index) => ({
          id: Date.now() + index,
          name: item.name || '',
          type: item.type || 'rectangle',
          color: item.color || '#FF6B6B',
          attributes: item.attributes ? item.attributes.map((attr, attrIndex) => ({
            id: Date.now() + index * 100 + attrIndex,
            name: attr.name || '',
            type: attr.input_type || 'text',
            values: Array.isArray(attr.values) ? attr.values.join(', ') : (attr.values || ''),
            mutable: attr.mutable || false
          })) : []
        }));
        setLabels(newLabels);
        setIsManualEdit(false);
        alert('JSON parsed successfully! Switched to Constructor view.');
        setEditorMode('constructor');
      }
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  // Handler for reset button
  const handleReset = () => {
    setRawJsonContent('[]');
    setIsManualEdit(false);
  };


  // Prepare project data for submission
  const prepareProjectData = () => {
    // Parse the JSON content to get the labels
    let labelsToSave = [];
    
    try {
      labelsToSave = JSON.parse(rawJsonContent);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      // Fallback to labels state
      labelsToSave = labels.map(label => ({
        name: label.name,
        type: label.type,
        attributes: label.attributes
          .filter(attr => attr.name.trim())
          .map(attr => ({
            name: attr.name,
            input_type: attr.type,
            mutable: attr.mutable,
            values: formatAttributeValues(attr),
            default_value: getDefaultValue(attr)
          }))
      }));
    }

    return {
      name: projectName,
      description: '', // You can add a description field if needed
      labels: labelsToSave
    };
  };

  // Handler for Submit & Continue
  const handleSubmitAndContinue = async () => {
    if (!projectName.trim()) {
      setSubmitError('Please enter a project name');
      return;
    }

    if (labels.length === 0 && rawJsonContent === '[]') {
      setSubmitError('Please add at least one label');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const projectData = prepareProjectData();

      const response = await axios.post(
        'http://localhost:5000/api/projects',
        projectData
      );

      setSubmitSuccess('Project created successfully! You can create another one.');
      
      // Reset the form
      setProjectName('');
      setLabels([]);
      setCurrentLabel({
        name: '',
        type: 'rectangle',
        color: '#FF6B6B',
        attributes: []
      });
      setRawJsonContent('[]');
      setIsManualEdit(false);
      
      // Reload projects
      loadProjects();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitError(error.response?.data?.error || 'Failed to create project. Please try again.');
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

    if (labels.length === 0 && rawJsonContent === '[]') {
      setSubmitError('Please add at least one label');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const projectData = prepareProjectData();

      const response = await axios.post(
        'http://localhost:5000/api/projects',
        projectData
      );

      setSubmitSuccess('Project created successfully! Redirecting...');
      
      // Reload projects
      await loadProjects();
      
      // Navigate to home/tasks page after a short delay
      setTimeout(() => {
        navigate('/home');
      }, 1000);
    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitError(error.response?.data?.error || 'Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  // Handler for deleting a project
  const handleDeleteProject = async (projectId, projectName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}`);
      
      // Remove the project from the local state
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      
      // Show success message (optional)
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'paused': return 'Paused';
      default: return 'Unknown';
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect
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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2>Create a new project</h2>
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
          <div>
            <p>Labels:</p>
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
                        onClick={parseJsonToLabels}
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
                  rows="10"
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
                    ⚠️ Manual edits detected. Click "Apply Changes" to update the labels.
                  </p>
                )}
              </div>
            )}
            {editorMode === 'constructor' && (
              <>
                <div style={{display:'flex', alignContent:'center', gap:'20px', width:'100%', margin:'0 auto 40px auto'}} className='constructor_editor'>
                  <input 
                    type="text" 
                    placeholder="Enter label name" 
                    value={currentLabel.name}
                    onChange={(e) => handleUpdateCurrentLabel('name', e.target.value)}
                  />
                  <select 
                    name="labelType" 
                    id="labelType"
                    value={currentLabel.type}
                    onChange={(e) => handleUpdateCurrentLabel('type', e.target.value)}
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="polygon">Polygon</option>
                    <option value="polyline">Polyline</option>
                    <option value="points">Points</option>
                    <option value="ellipse">Ellipse</option>
                    <option value="cuboid">Cuboid</option>
                    <option value="mask">Mask</option>
                    <option value="tag">Tag</option>
                  </select>
                  <input 
                    type="color" 
                    style={{height:'40px'}}
                    value={currentLabel.color}
                    onChange={(e) => handleUpdateCurrentLabel('color', e.target.value)}
                  />
                  <button onClick={handleAddLabel}>Add Label</button>
                  <button onClick={handleAddAttributeContainer}>Add an attribute</button>
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
                        <span style={{fontWeight: 'bold'}}>{label.name}</span>
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
                {currentLabel.attributes.map((container) => (
              <div key={container.id} className='add_attribute_container' style={{display:'flex', alignContent:'center', gap:'10px', width:'100%', marginBottom:'20px'}}>
                <input 
                  type="text" 
                  placeholder='Name' 
                  value={container.name}
                  onChange={(e) => handleUpdateAttributeContainer(container.id, 'name', e.target.value)}
                />
                <select 
                  name="Type" 
                  id="Type"
                  value={container.type}
                  onChange={(e) => handleUpdateAttributeContainer(container.id, 'type', e.target.value)}
                >
                  <option value="select">select</option>
                  <option value="radio">Radio</option>
                  <option value="checkbox">CheckBox</option>
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                </select>
                {container.type === 'radio' && (
                  <input 
                    type="text" 
                    placeholder='Values (comma separated: value1, value2, value3)'
                    value={container.values}
                    onChange={(e) => handleUpdateAttributeContainer(container.id, 'values', e.target.value)}
                    style={{minWidth: '200px'}}
                  />
                )}
                {container.type === 'checkbox' && (
                  <select 
                    value={container.values}
                    onChange={(e) => handleUpdateAttributeContainer(container.id, 'values', e.target.value)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                )}
                {container.type === 'Text' && (
                  <input 
                    type="text" 
                    placeholder='Default text value'
                    value={container.values}
                    onChange={(e) => handleUpdateAttributeContainer(container.id, 'values', e.target.value)}
                  />
                )}
                {container.type === 'Number' && (
                  <input 
                    type="text" 
                    placeholder='Format: min,max,step (e.g., 0,100,1)'
                    value={container.values}
                    onChange={(e) => handleUpdateAttributeContainer(container.id, 'values', e.target.value)}
                    style={{minWidth: '200px'}}
                  />
                )}
                {container.type === 'select' && (
                  <input 
                    type="text" 
                    placeholder='Options (comma separated: option1, option2)'
                    value={container.values}
                    onChange={(e) => handleUpdateAttributeContainer(container.id, 'values', e.target.value)}
                    style={{minWidth: '200px'}}
                  />
                )}
                <div>
                  <input 
                    type="checkbox" 
                    id={`checkbox-${container.id}`}
                    checked={container.mutable}
                    onChange={(e) => handleUpdateAttributeContainer(container.id, 'mutable', e.target.checked)}
                  />
                  <label htmlFor={`checkbox-${container.id}`}>Mutable</label>
                </div>
                <button 
                  style={{backgroundColor:'red', width:'100px', padding:'10px', color:'white'}}
                  onClick={() => handleDeleteAttributeContainer(container.id)}
                >
                  Delete
                </button>
              </div>
            ))}
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
              onClick={() => setShowCreateModal(false)}
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header page="projects" setPage={() => {}} />
      
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
                  <div style={{marginBottom: '16px'}}>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.name);
                    }}
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
                    title="Delete project"
                  >
                    <Trash2 size={16} color="#dc2626" />
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
