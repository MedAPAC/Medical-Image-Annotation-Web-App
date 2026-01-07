import React, { useState } from 'react';
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
  Palette
} from 'lucide-react';

const Projects = () => {
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

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '10px' , justifyContent: 'center', alignItems: 'center'}}>
      <div>
        <h1>Create a new project</h1>
      </div>
      <div style={{backgroundColor: 'gray', padding: '30px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' , width: '50%'}}>
        <div style= {{width: '100%'}}>
          <p>Name</p>
          <input 
            type="text" 
            placeholder="Enter project name" 
            style={{width: '100%' , height:'30px'}}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        <div>
          <p>Labels:</p>
          <div style={{display: 'flex', flexDirection: 'row', gap: '10px' , marginBottom:'30px' , borderBottom: '1px solid gray'}}>
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
              <div style={{display:'flex', alignContent:'center' , gap:'20px' , width:'100%' , margin:'0 auto 40px auto'}} className='constructor_editor'>
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
            <div key={container.id} className='add_attribute_container' style={{display:'flex', alignContent:'center',  gap:'10px' , width:'100%' , marginBottom:'20px'}}>
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
                style={{backgroundColor:'red' , width:'100px' , padding:'10px', color:'white'}}
                onClick={() => handleDeleteAttributeContainer(container.id)}
              >
                Delete
              </button>
            </div>
          ))}
            </>
          )}
        </div>
        <div style={{display:'flex' , alignContent:'center' , gap:'20px' , marginBottom:'20px'}}>
          <button 
            onClick={handleContinue}
            style={{backgroundColor:'blue' , width:'100px' , padding:'10px', color:'white'}}
          >
            Continue
          </button>
          <button style={{backgroundColor:'red' , width:'100px' , padding:'10px', color:'white'}}>Cancel</button>
        </div>
        <div style={{display:'flex' , alignContent:'center' , justifyContent:'end', gap:'20px' , width:'100%'}}>
          <button>Submit & Open</button>
          <button>Submit & Continue</button>
        </div>
      </div>
    </div>
  );
};

export default Projects;
