// annotation/components/FileUploadSection.jsx
import React from "react";

const FileUploadSection = ({
  files,
  uploadProgress,
  uploadMode,
  setUploadMode,
  handleDrop,
  handleFileChange,
  handleUpload
}) => {
  return (
    <div style={{
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
      maxWidth: "600px",
      margin: "40px auto",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      <h3>No files found in this task</h3>
      <p>Upload files to get started with annotation</p>
      
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed #cbd5e1",
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          width: "100%",
          cursor: "pointer"
        }}
      >
        <p>Drag & drop files here or</p>
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-upload">
          <button style={{
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}>
            Browse Files
          </button>
        </label>
        
        <div style={{ marginTop: "20px" }}>
          <select
            value={uploadMode}
            onChange={(e) => setUploadMode(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1"
            }}
          >
            <option value="nifti">NIfTI Files (.nii, .nii.gz)</option>
            <option value="dicom">DICOM Files (.dcm)</option>
          </select>
        </div>
      </div>

      {files.length > 0 && (
        <div style={{ width: "100%" }}>
          <h4>Selected Files:</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {files.map((file, index) => (
              <li key={index} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px",
                borderBottom: "1px solid #e2e8f0"
              }}>
                <span>{file.name}</span>
                <span>{uploadProgress[file.name] ? `${uploadProgress[file.name]}%` : "Ready"}</span>
              </li>
            ))}
          </ul>
          
          <button
            onClick={handleUpload}
            disabled={files.length === 0}
            style={{
              padding: "10px 20px",
              backgroundColor: files.length > 0 ? "#10b981" : "#cbd5e1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: files.length > 0 ? "pointer" : "not-allowed",
              width: "100%",
              marginTop: "20px"
            }}
          >
            Upload Files
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;