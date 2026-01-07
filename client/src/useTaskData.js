// hooks/useTaskData.js
import { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

const useTaskData = (taskId, isAuthenticated, token, language, navigate) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]); // Add uploadedFiles state

  const fetchTask = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language
        }
      });
      
      const task = response.data.task;
      setTaskData(task);
      
      // Process files from the task
      if (task.files && task.files.length > 0) {
        console.log("Task files found:", task.files);
        
        const processedFiles = task.files.map(file => {
          // Check if file has path or just filename
          let fileUrl;
          if (file.path) {
            // Extract filename from path if path exists
            const filename = file.path.split('/').pop();
            fileUrl = `http://localhost:5000/uploads/tasks/${taskId}/${filename}`;
          } else {
            // Use filename directly
            fileUrl = `http://localhost:5000/uploads/tasks/${taskId}/${file.filename}`;
          }
          
          return {
            originalName: file.originalName || file.filename,
            filename: file.filename,
            type: file.type || (file.filename.toLowerCase().endsWith('.dcm') ? 'dicom' : 
                  (file.filename.toLowerCase().endsWith('.nii') || 
                   file.filename.toLowerCase().endsWith('.nii.gz') ? 'nifti' : 'unknown')),
            url: fileUrl
          };
        });
        
        console.log("Processed files:", processedFiles);
        setUploadedFiles(processedFiles);
      } else {
        setError("No files found in this task");
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
    uploadedFiles, // Add uploadedFiles to return
    setUploadedFiles, // Add setUploadedFiles to return
    fetchTask
  };
};

export default useTaskData;