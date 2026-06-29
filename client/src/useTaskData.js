import { apiUrl, taskFileContentUrl } from './config/api';

// hooks/useTaskData.js
import { useState, useCallback } from "react";
import axios from "axios";

const useTaskData = (taskId, isAuthenticated, token, language, navigate) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]); 

  const fetchTask = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(apiUrl(`/api/tasks/${taskId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language
        }
      });
      
      const task = response.data.task;
      setTaskData(task);
      
      // Process files from the task
      if (task.files && task.files.length > 0) {
        
        const processedFiles = task.files.map(file => {
          // --- FIX START: Normalize Path for Windows/Linux compatibility ---
          let cleanFilename;

          // 1. Try to use the direct filename property from Multer first
          if (file.filename) {
            cleanFilename = file.filename;
          } 
          // 2. Fallback to parsing path, but replace Backslashes (\) with Slashes (/) first
          else if (file.path) {
            const normalizedPath = file.path.replace(/\\/g, '/');
            cleanFilename = normalizedPath.split('/').pop();
          }

          // Construct the URL
          const fileUrl = taskFileContentUrl(taskId, file._id || file.id || cleanFilename);
          
          // --- FIX END ---

          // --- FIX TYPE DETECTION: Check originalName for extension, as filename is randomized ---
          const nameToCheck = (file.originalName || cleanFilename).toLowerCase();
          
          let fileType = 'unknown';
          if (nameToCheck.endsWith('.dcm') || nameToCheck.endsWith('.dicom')) {
            fileType = 'dicom';
          } else if (nameToCheck.endsWith('.nii') || nameToCheck.endsWith('.nii.gz')) {
            fileType = 'nifti';
          }

          return {
            originalName: file.originalName || cleanFilename,
            filename: cleanFilename, // Ensure this matches the file on disk
            type: fileType,
            url: fileUrl
          };
        });
        
        setUploadedFiles(processedFiles);
      } else {
        // Don't set error here if it's just a new task with no files yet
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
      setError(error.response?.data?.error || "Failed to load task. Please try again.");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [taskId, isAuthenticated, token, language, navigate]);

  return {
    isLoading,
    error,
    taskData,
    setTaskData,
    uploadedFiles,
    setUploadedFiles,
    fetchTask
  };
};

export default useTaskData;
