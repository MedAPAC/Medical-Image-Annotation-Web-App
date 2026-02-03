// pages/Annotation.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from '../AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios'; // Required for saving

// Hooks
import useTaskData from "../useTaskData";
import useAnnotationData from "../useAnnotationData";
import useFileHandling from "../useFileHandling";

// Components
import Header from '../components/Header';
import TaskInfoBar from "../components/TaskInfoBar";
import FileUploadSection from "../components/FileUploadSection";
import ToolbarLeft from "../components/ToolbarLeft";
import LeftDrawer from "../components/LeftDrawer";
import MainViewer from "../components/MainViewer";
import ToolbarRight from "../components/ToolbarRight";
import RightPanel from "../components/RightPanel";

// Constants
import { SHAPES, SECTION_ICONS, LEFT_BUTTONS, RIGHT_BUTTONS } from "../constants";

function Annotation() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const { taskId } = useParams();

  // 1. Task Data Hook
  const {
    isLoading,
    error,
    taskData,
    setTaskData,
    uploadedFiles: taskUploadedFiles,
    setUploadedFiles: setTaskUploadedFiles,
    fetchTask
  } = useTaskData(taskId, isAuthenticated, token, i18n.language, navigate);

  // 2. Annotation Data Hook
  const {
    selectedShape, setSelectedShape,
    selectedLabel, setSelectedLabel,
    labelOptions, setLabelOptions, 
    selectedFileName, setSelectedFileName,
    windowCenter, setWindowCenter,
    windowWidth, setWindowWidth,
    brushColor, setBrushColor,
    brushSize, setBrushSize,
    toolChangeId, setToolChangeId,
    annotationOpacity, setAnnotationOpacity,
    openSection, setOpenSection,
    totalSlices, setTotalSlices,
    zoomLevel, setZoomLevel,
    isZoomMode, setIsZoomMode,
    zoomRegion, setZoomRegion,
    inputsByFileAndSlice, setInputsByFileAndSlice,
    currentSlice, setCurrentSlice,
    classificationByFileAndSlice, setClassificationByFileAndSlice,
    annotationsByFileAndSlice, setAnnotationsByFileAndSlice, // Destructured
    saveSliceAnnotationToState, // Destructured
    rightPanelOpen, setRightPanelOpen,
    viewType, setViewType,
    annotationRefs
  } = useAnnotationData();

  // 3. File Handling Hook
  const {
    files, setFiles,
    uploadProgress, setUploadProgress,
    uploadedFiles: newlyUploadedFiles, setUploadedFiles: setNewlyUploadedFiles,
    uploadMode, setUploadMode,
    handleDrop, handleFileChange, handleUpload
  } = useFileHandling(taskId, token, setSelectedFileName);

  // -----------------------------------------------------------------------
  // CRITICAL: File Switching Handler (Fixes NaN / Crash issues)
  // -----------------------------------------------------------------------
  const handleFileSwitch = useCallback((newFileName) => {
    if (newFileName === selectedFileName) return;

    // 1. SAVE: Save the current canvas state before leaving the old file
    if (selectedFileName && annotationRefs.current[selectedFileName]?.current) {
      saveSliceAnnotationToState(
        selectedFileName, 
        currentSlice, 
        annotationRefs.current[selectedFileName].current
      );
    }

    // 2. RESET COUNTERS: Critical to prevent "NaN" or accessing out-of-bounds slices
    // This forces the viewer to reset its internal slider constraints immediately
    setTotalSlices(0); 
    setCurrentSlice(0);

    // 3. SWITCH: Update the filename to trigger loading the new file
    setSelectedFileName(newFileName);
  }, [selectedFileName, currentSlice, annotationRefs, saveSliceAnnotationToState, setTotalSlices, setCurrentSlice, setSelectedFileName]);

  // -----------------------------------------------------------------------
  // STANDARDIZED SAVING LOGIC
  // -----------------------------------------------------------------------
  const generateStandardizedPayload = useCallback(() => {
    // Ensure the CURRENT slice is saved to state before generating payload
    if (selectedFileName && annotationRefs.current[selectedFileName]?.current) {
      saveSliceAnnotationToState(
        selectedFileName, 
        currentSlice, 
        annotationRefs.current[selectedFileName].current
      );
    }

    // Helper to merge data from our 3 state objects
    const fileNames = new Set([
      ...Object.keys(annotationsByFileAndSlice),
      ...Object.keys(classificationByFileAndSlice),
      ...Object.keys(inputsByFileAndSlice)
    ]);

    const resultSlices = [];

    fileNames.forEach(fileName => {
      // Find all slice indices for this file that have ANY data
      const slices = new Set([
        ...Object.keys(annotationsByFileAndSlice[fileName] || {}),
        ...Object.keys(classificationByFileAndSlice[fileName] || {}),
        ...Object.keys(inputsByFileAndSlice[fileName] || {})
      ]);

      slices.forEach(sliceIndexStr => {
        const sliceIndex = parseInt(sliceIndexStr, 10);
        
        resultSlices.push({
          sliceIndex: sliceIndex,
          fileName: fileName,
          classification: classificationByFileAndSlice[fileName]?.[sliceIndex] || {},
          attributes: inputsByFileAndSlice[fileName]?.[sliceIndex] || {},
          // Parse the FabricJS JSON if it exists, or pass empty array
          annotations: annotationsByFileAndSlice[fileName]?.[sliceIndex]?.objects || [] 
        });
      });
    });

    return {
      taskId: taskId,
      lastModified: new Date().toISOString(),
      slices: resultSlices
    };
  }, [selectedFileName, currentSlice, annotationRefs, saveSliceAnnotationToState, annotationsByFileAndSlice, classificationByFileAndSlice, inputsByFileAndSlice, taskId]);

  const handleStandardSave = useCallback(async () => {
    try {
      const payload = generateStandardizedPayload();
      console.log("Saving Payload:", payload);

      await axios.post('http://localhost:5000/api/annotations/save', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Saved successfully!");
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save annotations.");
    }
  }, [generateStandardizedPayload, token]);

  // -----------------------------------------------------------------------
  // LABEL & TOOL FILTERING LOGIC
  // -----------------------------------------------------------------------
  const [allProjectLabels, setAllProjectLabels] = useState([]);

  // Load labels from Task Data
  useEffect(() => {
    if (taskData && taskData.labels) {
      const formatted = taskData.labels.map(l => ({
        value: l.name,
        label: l.name,
        color: l.color || "#ffffff",
        type: l.type
      }));
      setAllProjectLabels(formatted);
    }
  }, [taskData]);

  // Filter Options based on Selected Shape (Tool)
  useEffect(() => {
    if (allProjectLabels.length > 0) {
      // Fix: If selectedShape is NULL (cursor), show ALL labels
      const relevantLabels = allProjectLabels.filter(
        l => !selectedShape || l.type === selectedShape || !l.type
      );
      setLabelOptions(relevantLabels);
    }
  }, [selectedShape, allProjectLabels, setLabelOptions]);

  // Auto-Select Valid Label & Sync Color
  useEffect(() => {
    if (labelOptions.length > 0) {
      const currentLabelIsValid = labelOptions.find(l => l.value === selectedLabel);

      if (!currentLabelIsValid) {
        // Switch to first valid option
        const firstOption = labelOptions[0];
        setSelectedLabel(firstOption.value);
        // Do not set color here, let the next effect handle it
      }
    }
  }, [labelOptions, selectedLabel, setSelectedLabel]);

  // Sync Color when Label Changes
  useEffect(() => {
    if (selectedLabel && labelOptions.length > 0) {
      const activeOption = labelOptions.find(opt => opt.value === selectedLabel);
      if (activeOption && activeOption.color !== brushColor) {
        setBrushColor(activeOption.color);
      }
    } else if (labelOptions.length > 0 && !selectedLabel) {
       setBrushColor(labelOptions[0].color);
    }
  }, [selectedLabel, labelOptions, brushColor, setBrushColor]);

  // -----------------------------------------------------------------------
  // CALCULATED VALUES
  // -----------------------------------------------------------------------

  const allowedShapeIds = useMemo(() => {
    if (!taskData || !taskData.labels || taskData.labels.length === 0) {
      return SHAPES.map(s => s.id); 
    }
    return Array.from(new Set(taskData.labels.map(l => l.type)));
  }, [taskData]);

  const projectAttributes = useMemo(() => {
    if (!taskData || !taskData.attributes) return [];
    return taskData.attributes;
  }, [taskData]);

  const allUploadedFiles = useMemo(() => {
    return [...taskUploadedFiles, ...newlyUploadedFiles];
  }, [taskUploadedFiles, newlyUploadedFiles]);

  // Initial file selection
  useEffect(() => {
    if (allUploadedFiles.length > 0 && !selectedFileName) {
      setSelectedFileName(allUploadedFiles[0].originalName);
    }
  }, [allUploadedFiles, selectedFileName, setSelectedFileName]);

  // Auth & Data Loading
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && token && taskId) fetchTask();
  }, [isAuthenticated, token, taskId, fetchTask]);

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div>Loading task data...</div>
      </div>
    );
  }

  if (!taskData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "20px" }}>
        <div style={{ fontSize: "18px", color: "#dc2626" }}>{error || "Task not found."}</div>
        <button onClick={() => navigate('/tasks')}>Back to Tasks</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #f8fafc, #fff)", display: "flex", flexDirection: "column" }}>
      <Header page="tasks" />
      
      {/* 
        Updated TaskInfoBar:
        - Passed 'files' (allUploadedFiles)
        - Passed 'onFileSelect' (handleFileSwitch)
      */}
      <TaskInfoBar 
        taskData={taskData} 
        files={allUploadedFiles}
        selectedFileName={selectedFileName}
        onFileSelect={handleFileSwitch}
      />
      
      {allUploadedFiles.length === 0 && !isLoading && (
        <FileUploadSection
          files={files}
          uploadProgress={uploadProgress}
          uploadMode={uploadMode}
          setUploadMode={setUploadMode}
          handleDrop={handleDrop}
          handleFileChange={handleFileChange}
          handleUpload={() => handleUpload().then(() => fetchTask())} 
        />
      )}

      {allUploadedFiles.length > 0 && (
        <>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "250px 1fr 250px", gap: "16px", padding: "16px", height: "100%" }}>
            <div style={{ flexBasis: "48px", flexShrink: 0 }}> </div>
            
            <ToolbarLeft
              shapes={SHAPES} 
              allowedShapeIds={allowedShapeIds}
              selectedShape={selectedShape}
              setSelectedShape={setSelectedShape}
              setToolChangeId={setToolChangeId}
              sectionIcons={SECTION_ICONS}
              openSection={openSection}
              setOpenSection={setOpenSection}
            />

            <LeftDrawer
              openSection={openSection}
              windowCenter={windowCenter}
              windowWidth={windowWidth}
              setWindowCenter={setWindowCenter}
              setWindowWidth={setWindowWidth}
              annotationOpacity={annotationOpacity}
              setAnnotationOpacity={setAnnotationOpacity}
              selectedShape={selectedShape}
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              
              selectedLabel={selectedLabel}
              setSelectedLabel={setSelectedLabel}
              labelOptions={labelOptions}
              t={t}
            />

            {/* 
              MainViewer:
              - Passed saveSliceAnnotationToState to ensure canvas saves on internal logic
              - Passed annotationsByFileAndSlice for restoration
            */}
            <MainViewer
              uploadedFiles={allUploadedFiles}
              selectedFileName={selectedFileName}
              windowCenter={windowCenter}
              windowWidth={windowWidth}
              currentSlice={currentSlice}
              setCurrentSlice={setCurrentSlice}
              setTotalSlices={setTotalSlices}
              zoomLevel={zoomLevel}
              zoomRegion={zoomRegion}
              isZoomMode={isZoomMode}
              viewType={viewType}
              
              selectedShape={selectedShape}
              selectedLabel={selectedLabel}
              brushColor={brushColor}
              brushSize={brushSize}
              
              toolChangeId={toolChangeId}
              annotationOpacity={annotationOpacity}
              
              classificationByFileAndSlice={classificationByFileAndSlice}
              annotationsByFileAndSlice={annotationsByFileAndSlice}
              saveSliceAnnotationToState={saveSliceAnnotationToState}
              
              annotationRefs={annotationRefs}
              totalSlices={totalSlices}
            />
          </div>

          <ToolbarRight
            buttons_right={RIGHT_BUTTONS}
            selectedFileName={selectedFileName}
            annotationRefs={annotationRefs}
            buttons={LEFT_BUTTONS}
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
            taskData={taskData}
            currentSlice={currentSlice}
            totalSlices={totalSlices}
            token={token}
            taskId={taskId}
            setTaskData={setTaskData}
            onSave={handleStandardSave} // Passed Standardized Save Handler
          />

          <RightPanel
            rightPanelOpen={rightPanelOpen}
            t={t}
            viewType={viewType}
            setViewType={setViewType}
            selectedFileName={selectedFileName}
            currentSlice={currentSlice}
            setCurrentSlice={setCurrentSlice}
            classificationByFileAndSlice={classificationByFileAndSlice}
            setClassificationByFileAndSlice={setClassificationByFileAndSlice}
            inputsByFileAndSlice={inputsByFileAndSlice}
            setInputsByFileAndSlice={setInputsByFileAndSlice}
            totalSlices={totalSlices}
            isZoomMode={isZoomMode}
            setIsZoomMode={setIsZoomMode}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            zoomRegion={setZoomRegion}
            projectAttributes={projectAttributes} 
          />
        </>
      )}
    </div>
  );
}

export default Annotation;
