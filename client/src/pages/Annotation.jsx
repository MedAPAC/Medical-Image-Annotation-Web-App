// pages/Annotation.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from '../AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

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
    currentSlice, setCurrentSlice,
    rightPanelOpen, setRightPanelOpen,
    viewType, setViewType,
    annotationRefs,
    
    // === CRITICAL FIX: Destructure these so they are defined ===
    saveSliceAnnotationToState,
    annotationsByFileAndSlice,
    setAnnotationsByFileAndSlice,
    inputsByFileAndSlice, 
    setInputsByFileAndSlice,
    classificationByFileAndSlice, 
    setClassificationByFileAndSlice
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
  // LOGIC: Label & Color Filtering
  // -----------------------------------------------------------------------
  const [allProjectLabels, setAllProjectLabels] = useState([]);

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

  useEffect(() => {
    if (allProjectLabels.length > 0) {
      const relevantLabels = selectedShape
        ? allProjectLabels.filter(l => l.type === selectedShape || !l.type)
        : allProjectLabels;
      setLabelOptions(relevantLabels);
    }
  }, [selectedShape, allProjectLabels, setLabelOptions]);

  useEffect(() => {
    if (labelOptions.length > 0) {
      const currentLabelIsValid = labelOptions.find(l => l.value === selectedLabel);
      if (!currentLabelIsValid) {
        const firstOption = labelOptions[0];
        setSelectedLabel(firstOption.value);
      }
    }
  }, [labelOptions, selectedLabel, setSelectedLabel]);

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

  const allowedShapeIds = useMemo(() => {
    if (!taskData || !taskData.labels || taskData.labels.length === 0) {
      return SHAPES.map(s => s.id); 
    }
    return Array.from(new Set(taskData.labels.map(l => l.type)));
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


  // -----------------------------------------------------------------------
  // FILE SWITCHING LOGIC (Fixed)
  // -----------------------------------------------------------------------
  // Inside Annotation.jsx

  const handleFileSwitch = (newFileName) => {
    if (newFileName === selectedFileName) return;

    // 1. SAVE: Save the current canvas state before leaving
    if (selectedFileName && annotationRefs.current[selectedFileName]?.current) {
      saveSliceAnnotationToState(
        selectedFileName, 
        currentSlice, 
        annotationRefs.current[selectedFileName].current
      );
    }

    // 2. RESET: Reset critical counters immediately
    // This prevents the UI from calculating "NaN" or accessing out-of-bounds slices
    setTotalSlices(0); 
    setCurrentSlice(0);

    // 3. SWITCH: Update the filename
    setSelectedFileName(newFileName);
  };

  // -----------------------------------------------------------------------
  // STANDARD FORMAT SAVING LOGIC
  // -----------------------------------------------------------------------

  const generateStandardizedPayload = useCallback(async () => {
    if (!selectedFileName) return null;

    // 1. Get Live Canvas Objects (Current Slice)
    let currentCanvasObjects = [];
    if (
      annotationRefs.current &&
      annotationRefs.current[selectedFileName] &&
      annotationRefs.current[selectedFileName].current
    ) {
      const rawJson = await annotationRefs.current[selectedFileName].current.exportAnnotations();
      if (rawJson && rawJson.objects) {
        currentCanvasObjects = rawJson.objects;
      }
    }

    // 2. Get Stored Data
    const fileAnnotations = annotationsByFileAndSlice[selectedFileName] || {};
    const fileAttributes = inputsByFileAndSlice[selectedFileName] || {};
    const fileClassification = classificationByFileAndSlice[selectedFileName] || {};

    // 3. Identify all slices that have data
    const allSliceIndices = new Set([
      ...Object.keys(fileAnnotations).map(k => parseInt(k)),
      ...Object.keys(fileAttributes).map(k => parseInt(k)),
      ...Object.keys(fileClassification).map(k => parseInt(k)),
      currentSlice 
    ]);

    // 4. Construct Slices Array
    const formattedSlices = Array.from(allSliceIndices).map(sliceIdx => {
      let sliceObjects = [];
      // If this is the current slice, use the live canvas objects
      if (sliceIdx === currentSlice) {
        sliceObjects = currentCanvasObjects;
      } else if (fileAnnotations[sliceIdx] && fileAnnotations[sliceIdx].objects) {
        // Otherwise use stored state
        sliceObjects = fileAnnotations[sliceIdx].objects;
      }

      // Clean up FabricJS objects to minimal JSON
      const cleanAnnotations = sliceObjects.map(obj => ({
        type: obj.type,
        left: Math.round(obj.left * 100) / 100,
        top: Math.round(obj.top * 100) / 100,
        width: obj.width ? Math.round(obj.width * 100) / 100 : undefined,
        height: obj.height ? Math.round(obj.height * 100) / 100 : undefined,
        radius: obj.radius ? Math.round(obj.radius * 100) / 100 : undefined,
        points: obj.points ? obj.points : undefined, 
        label: obj.label || obj.type, 
        fill: obj.fill,
        stroke: obj.stroke
      }));

      // Merge inputs and classification
      const sliceClassification = {
        ...fileAttributes[sliceIdx],      
        ...fileClassification[sliceIdx]   
      };

      return {
        sliceIndex: sliceIdx,
        classification: sliceClassification,
        annotations: cleanAnnotations
      };
    });

    const payload = {
      taskId: taskId,
      fileName: selectedFileName,
      lastModified: new Date().toISOString(),
      slices: formattedSlices.sort((a, b) => a.sliceIndex - b.sliceIndex)
    };

    return payload;

  }, [
    selectedFileName, 
    annotationsByFileAndSlice, 
    inputsByFileAndSlice, 
    classificationByFileAndSlice, 
    currentSlice, 
    taskId,
    annotationRefs
  ]);

  const handleStandardSave = async () => {
    try {
      const payload = await generateStandardizedPayload();
      
      if (!payload) {
        console.warn("No payload generated.");
        return;
      }

      console.log("Saving Payload:", JSON.stringify(payload, null, 2));

      // Adjust URL as needed
      const response = await axios.post(`http://localhost:5000/api/annotations/save`, payload, {
         headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        alert("Saved successfully!");
      }
    } catch (err) {
      console.error("Error saving annotations:", err);
      alert("Failed to save.");
    }
  };

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
      
      {/* UPDATED: Pass File Selection Props */}
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
              // === Pass props for internal state saving ===
              saveSliceAnnotationToState={saveSliceAnnotationToState}
              annotationsByFileAndSlice={annotationsByFileAndSlice}
              setAnnotationsByFileAndSlice={setAnnotationsByFileAndSlice}
              setInputsByFileAndSlice={setInputsByFileAndSlice}
              setClassificationByFileAndSlice={setClassificationByFileAndSlice}
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
            // === Pass Standard Save Handler ===
            onSave={handleStandardSave}
            // === Pass State Props ===
            inputsByFileAndSlice={inputsByFileAndSlice}
            classificationByFileAndSlice={classificationByFileAndSlice}
            annotationsByFileAndSlice={annotationsByFileAndSlice}
            saveSliceAnnotationToState={saveSliceAnnotationToState}
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
          />
        </>
      )}
    </div>
  );
}

export default Annotation;
