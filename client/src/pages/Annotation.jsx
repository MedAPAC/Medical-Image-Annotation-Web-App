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
    selectedShape,
    setSelectedShape,
    selectedLabel,
    setSelectedLabel,
    labelOptions: defaultLabelOptions,
    selectedFileName,
    setSelectedFileName,
    windowCenter,
    setWindowCenter,
    windowWidth,
    setWindowWidth,
    brushColor,
    setBrushColor,
    brushSize,
    setBrushSize,
    toolChangeId,
    setToolChangeId,
    annotationOpacity,
    setAnnotationOpacity,
    openSection,
    setOpenSection,
    totalSlices,
    setTotalSlices,
    zoomLevel,
    setZoomLevel,
    isZoomMode,
    setIsZoomMode,
    zoomRegion,
    setZoomRegion,
    inputsByFileAndSlice,
    setInputsByFileAndSlice,
    currentSlice,
    setCurrentSlice,
    classificationByFileAndSlice,
    setClassificationByFileAndSlice,
    rightPanelOpen,
    setRightPanelOpen,
    viewType,
    setViewType,
    annotationRefs
  } = useAnnotationData();

  // 3. File Handling Hook
  const {
    files,
    setFiles,
    uploadProgress,
    setUploadProgress,
    uploadedFiles: newlyUploadedFiles,
    setUploadedFiles: setNewlyUploadedFiles,
    uploadMode,
    setUploadMode,
    handleDrop,
    handleFileChange,
    handleUpload
  } = useFileHandling(taskId, token, setSelectedFileName);

  // -----------------------------------------------------------------------
  // PROJECT CONFIGURATION LOGIC
  // -----------------------------------------------------------------------

  const projectConfig = useMemo(() => {
    if (!taskData) return null;
    return taskData.project || taskData;
  }, [taskData]);

  // A. Determine Allowed Shape IDs (Strings only)
  // Instead of filtering the objects, we just get a whitelist of IDs.
  const allowedShapeIds = useMemo(() => {
    // If no labels defined, assume all are allowed (or empty, depending on preference)
    if (!projectConfig || !projectConfig.labels || projectConfig.labels.length === 0) {
      return SHAPES.map(s => s.id); 
    }

    // Get unique types defined in project labels
    return Array.from(new Set(projectConfig.labels.map(l => l.type)));
  }, [projectConfig]);

  // B. Configure Label Options
  const projectLabelOptions = useMemo(() => {
    if (!projectConfig || !projectConfig.labels) return defaultLabelOptions;

    return projectConfig.labels.map(l => ({
      value: l.name,
      label: l.name,
      color: l.color,
      type: l.type
    }));
  }, [projectConfig, defaultLabelOptions]);

  // C. Configure Attributes
  const projectAttributes = useMemo(() => {
    if (!projectConfig || !projectConfig.attributes) return [];
    return projectConfig.attributes;
  }, [projectConfig]);

  // D. Ensure Selected Shape is Valid
  // If the user's current selection isn't in the allowed list, force switch to the first allowed one.
  useEffect(() => {
    if (allowedShapeIds.length > 0 && selectedShape) {
      if (!allowedShapeIds.includes(selectedShape)) {
        // Default to the first allowed shape
        setSelectedShape(allowedShapeIds[0]);
      }
    }
  }, [allowedShapeIds, selectedShape, setSelectedShape]);

  // E. Auto-select Color based on Label
  useEffect(() => {
    if (selectedLabel && projectLabelOptions) {
      const labelDef = projectLabelOptions.find(l => l.value === selectedLabel);
      if (labelDef && labelDef.color) {
        setBrushColor(labelDef.color);
      }
    }
  }, [selectedLabel, projectLabelOptions, setBrushColor]);

  // -----------------------------------------------------------------------

  const allUploadedFiles = useMemo(() => {
    return [...taskUploadedFiles, ...newlyUploadedFiles];
  }, [taskUploadedFiles, newlyUploadedFiles]);

  useEffect(() => {
    if (allUploadedFiles.length > 0 && !selectedFileName) {
      setSelectedFileName(allUploadedFiles[0].originalName);
    }
  }, [allUploadedFiles, selectedFileName, setSelectedFileName]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && token && taskId) {
      fetchTask();
    }
  }, [isAuthenticated, token, taskId, fetchTask]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc, #fff)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div>Loading task data...</div>
      </div>
    );
  }

  if (!taskData) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc, #fff)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px"
      }}>
        <div style={{ fontSize: "18px", color: "#dc2626" }}>{error || "Task not found."}</div>
        <button 
          onClick={() => navigate('/tasks')}
          style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc, #fff)",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "250px 1fr 250px",
              gap: "16px",
              padding: "16px",
              height: "100%",
            }}
          >
            <div style={{ flexBasis: "48px", flexShrink: 0 }}> </div>
            
            {/* UPDATED: Pass ALL SHAPES + allowedShapeIds */}
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
