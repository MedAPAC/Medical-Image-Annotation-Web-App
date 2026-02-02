// pages/Annotation.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from '../AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

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
  // IMPROVED STATE MANAGEMENT: Label & Color Filtering
  // -----------------------------------------------------------------------

  // Store ALL labels from backend separately from the currently visible options
  const [allProjectLabels, setAllProjectLabels] = useState([]);

  // STEP 1: Load all labels from Task Data when it arrives
  useEffect(() => {
    if (taskData && taskData.labels) {
      const formatted = taskData.labels.map(l => ({
        value: l.name,
        label: l.name,
        color: l.color || "#ffffff", // Default to white if missing
        type: l.type // e.g., 'polygon', 'brush', 'rectangle'
      }));
      setAllProjectLabels(formatted);
    }
  }, [taskData]);

  // STEP 2: Filter Options based on Selected Shape
  // Whenever the user changes the tool (Shape), we update the dropdown list (labelOptions)
  useEffect(() => {
    if (allProjectLabels.length > 0) {
      // Filter: Show label if its type matches selectedShape OR if it has no type (global)
      const relevantLabels = allProjectLabels.filter(
        l => l.type === selectedShape || !l.type
      );
      setLabelOptions(relevantLabels);
    }
  }, [selectedShape, allProjectLabels, setLabelOptions]);

  // STEP 3: Validate & Auto-Select Label
  // Whenever the available options change (due to tool change), check if current selection is valid
  useEffect(() => {
    if (labelOptions.length > 0) {
      const currentLabelIsValid = labelOptions.find(l => l.value === selectedLabel);

      if (!currentLabelIsValid) {
        // If current label is invalid for this tool, switch to the first valid one
        const firstOption = labelOptions[0];
        setSelectedLabel(firstOption.value);
        // We do NOT set color here, we let Step 4 handle it to avoid duplicate updates
      }
    }
  }, [labelOptions, selectedLabel, setSelectedLabel]);

  // STEP 4: Sync Color to Selected Label
  // Whenever the selected label changes (either automatically by Step 3 or manually by user), update color
  useEffect(() => {
    if (selectedLabel && labelOptions.length > 0) {
      const activeOption = labelOptions.find(opt => opt.value === selectedLabel);
      if (activeOption && activeOption.color !== brushColor) {
        setBrushColor(activeOption.color);
      }
    } else if (labelOptions.length > 0 && !selectedLabel) {
       // Fallback: if no label selected but options exist, pick first color
       setBrushColor(labelOptions[0].color);
    }
  }, [selectedLabel, labelOptions, brushColor, setBrushColor]);

  // -----------------------------------------------------------------------

  // Determine Allowed Shape IDs for Toolbar (Visual disabling/enabling)
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

  useEffect(() => {
    if (allUploadedFiles.length > 0 && !selectedFileName) {
      setSelectedFileName(allUploadedFiles[0].originalName);
    }
  }, [allUploadedFiles, selectedFileName, setSelectedFileName]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && token && taskId) fetchTask();
  }, [isAuthenticated, token, taskId, fetchTask]);

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
      <TaskInfoBar taskData={taskData} />
      
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
              
              // Now passes the FILTERED list specific to the current shape
              selectedLabel={selectedLabel}
              setSelectedLabel={setSelectedLabel}
              labelOptions={labelOptions}
              t={t}
            />

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
