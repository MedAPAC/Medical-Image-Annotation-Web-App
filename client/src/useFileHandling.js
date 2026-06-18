// hooks/useFileHandling.js
import { useState } from "react";
import axios from "axios";

const useFileHandling = (taskId, token, setSelectedFileName, notify) => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadMode, setUploadMode] = useState("nifti");

  const showAlert = (type, message) => {
    if (notify) {
      notify(type, message);
      return;
    }
    console.warn(message);
  };

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
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const handleFileChange = (e) => {
    const inputFiles = Array.from(e.target.files);
    addFiles(inputFiles);
    e.target.value = null;
  };

  const handleUpload = async () => {
    if (!token) {
      showAlert("error", "Please login to upload files");
      return;
    }

    const newUploadedFiles = [];
    for (const file of files) {
      const alreadyUploaded = uploadedFiles.find(
        (f) => f.originalName === file.name
      );
      if (alreadyUploaded) continue;

      const formData = new FormData();
      formData.append("files", file);

      try {
        const res = await axios.post(`http://localhost:5000/api/tasks/${taskId}/files`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
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

        const uploadedFile = {
          originalName: file.name,
          filename: res.data.files[0].filename,
          type,
          url: `http://localhost:5000/uploads/tasks/${taskId}/${res.data.files[0].filename}`
        };
        
        newUploadedFiles.push(uploadedFile);
        
        // Clear upload progress
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      } catch (err) {
        console.error("Upload error:", err);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
        showAlert("error", `Failed to upload ${file.name}: ${err.response?.data?.error || err.message}`);
      }
    }

    // Update uploaded files
    setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
    
    // Clear selected files
    setFiles([]);
    
    // Set selected file if we have uploaded files
    if (newUploadedFiles.length > 0) {
      setSelectedFileName(newUploadedFiles[0].originalName);
    }

    return newUploadedFiles;
  };

  const allUploaded = files.length > 0 &&
    files.every((f) => uploadProgress[f.name] === 100) &&
    uploadedFiles.length === files.length;

  return {
    files,
    setFiles,
    uploadProgress,
    setUploadProgress,
    uploadedFiles,
    setUploadedFiles,
    uploadMode,
    setUploadMode,
    handleDrop,
    handleFileChange,
    handleUpload,
    allUploaded
  };
};

export default useFileHandling;
