import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import Header from '../components/Header';
import { 
  Upload as UploadIcon, 
  File, 
  CheckCircle, 
  ArrowRight,
  X
} from 'lucide-react';

const UploadPage = () => {
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [uploadMode, setUploadMode] = useState("nifti");
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      const lowerName = file.name.toLowerCase();
      if (uploadMode === "nifti") {
        return lowerName.endsWith(".nii") || lowerName.endsWith(".nii.gz");
      } else if (uploadMode === "dicom") {
        return lowerName.endsWith(".dcm");
      }
      return false;
    });
    
    const existingNames = new Set(files.map((f) => f.name));
    const filtered = validFiles.filter((f) => !existingNames.has(f.name));
    setFiles((prev) => [...prev, ...filtered]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileChange = (e) => {
    const inputFiles = Array.from(e.target.files);
    addFiles(inputFiles);
    e.target.value = null;
  };

  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    const newUploadedFiles = [...uploadedFiles];
    
    for (const file of files) {
      const alreadyUploaded = newUploadedFiles.find(
        (f) => f.originalName === file.name
      );
      if (alreadyUploaded) continue;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post("http://localhost:5000/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percent,
            }));
          },
        });

        const lowerName = file.name.toLowerCase();
        let type = "unknown";
        if (lowerName.endsWith(".nii") || lowerName.endsWith(".nii.gz"))
          type = "nifti";
        else if (lowerName.endsWith(".dcm")) type = "dicom";

        newUploadedFiles.push({
          originalName: file.name,
          filename: res.data.filename,
          type,
        });
      } catch (err) {
        console.error("Upload error:", err);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      }
    }

    setUploadedFiles(newUploadedFiles);
    setIsUploading(false);
  };

  const allUploaded =
    files.length > 0 &&
    files.every((f) => uploadProgress[f.name] === 100) &&
    uploadedFiles.length === files.length;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="upload-page enterprise-page" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header page="upload" />
      <div style={{ padding: '20px', flex: 1 }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          color: 'white',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <UploadIcon size={32} />
            Medical Image Upload
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '16px',
            opacity: 0.9
          }}>
            Welcome {user?.name || user?.email} - Upload your images
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Upload Mode Selector */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: uploadMode === 'nifti' ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: uploadMode === 'nifti' ? '#eff6ff' : '#ffffff'
            }}>
              <input
                type="radio"
                name="uploadMode"
                value="nifti"
                checked={uploadMode === "nifti"}
                onChange={() => {
                  setFiles([]);
                  setUploadProgress({});
                  setUploadedFiles([]);
                  setUploadMode("nifti");
                }}
              />
              NIfTI
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: uploadMode === 'dicom' ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: uploadMode === 'dicom' ? '#eff6ff' : '#ffffff'
            }}>
              <input
                type="radio"
                name="uploadMode"
                value="dicom"
                checked={uploadMode === "dicom"}
                onChange={() => {
                  setFiles([]);
                  setUploadProgress({});
                  setUploadedFiles([]);
                  setUploadMode("dicom");
                }}
              />
              DICOM
            </label>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("fileInput").click()}
            style={{
              border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
              borderRadius: '8px',
              padding: '32px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragActive ? '#f8faff' : '#fafafa',
              transition: 'all 0.3s ease',
              marginBottom: '16px'
            }}
          >
            <UploadIcon 
              size={32} 
              color={dragActive ? '#3b82f6' : '#6b7280'} 
              style={{ marginBottom: '12px' }}
            />
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '500',
              color: '#374151'
            }}>
              {dragActive ? 'Drop files here' : 'Drag and drop files here or click to select'}
            </p>
            <p style={{
              margin: '0 0 12px 0',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              {uploadMode === "dicom"
                ? "Select DICOM folder or .dcm files"
                : "Select .nii or .nii.gz files"}
            </p>
            <button
              type="button"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Select Files
            </button>
            <input
              id="fileInput"
              type="file"
              multiple
              {...(uploadMode === "dicom"
                ? { webkitdirectory: "true", directory: "true", accept: ".dcm" }
                : { accept: ".nii,.nii.gz" })}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {files.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Selected Files ({files.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((file) => {
                  const progress = uploadProgress[file.name] || 0;
                  return (
                    <div
                      key={file.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <File size={16} color="#6b7280" />
                        <span style={{
                          fontSize: '14px',
                          color: '#374151',
                          flex: 1
                        }}>
                          {file.name} ({formatFileSize(file.size)})
                        </span>
                        {progress > 0 && (
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            minWidth: '40px',
                            textAlign: 'right'
                          }}>
                            {progress}%
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(file.name)}
                        style={{
                          padding: '4px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          color: '#6b7280'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading || allUploaded}
              style={{
                padding: '10px 20px',
                backgroundColor: files.length === 0 || isUploading || allUploaded ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: files.length === 0 || isUploading || allUploaded ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <UploadIcon size={16} />
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            
            <button
              onClick={() => navigate('/tasks')}
              disabled={!allUploaded}
              style={{
                padding: '10px 20px',
                backgroundColor: !allUploaded ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: !allUploaded ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ArrowRight size={16} />
              Next
            </button>
          </div>




          {/* Action Buttons */}
          {/* <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading || allUploaded}
              style={{
                padding: '12px 24px',
                backgroundColor: files.length === 0 || isUploading || allUploaded ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: files.length === 0 || isUploading || allUploaded ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.3s'
              }}
            >
              <UploadIcon size={20} />
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            
            <button
              onClick={() => navigate('/')}
              disabled={!allUploaded}
              style={{
                padding: '12px 24px',
                backgroundColor: !allUploaded ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: !allUploaded ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.3s'
              }}
            >
              <ArrowRight size={20} />
              Next
            </button>
          </div> */}

          {/* Success Message */}
          {allUploaded && (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle size={24} color="#10b981" />
              <div>
                <h4 style={{
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#065f46'
                }}>
                  Upload completed successfully!
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#047857'
                }}>
                  {uploadedFiles.length} files uploaded. You can now proceed to annotation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default UploadPage;
