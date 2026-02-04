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
    isLoading, taskData,
    uploadedFiles: taskUploadedFiles, fetchTask
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
    annotationsByFileAndSlice, setAnnotationsByFileAndSlice,
    saveSliceAnnotationToState,
    rightPanelOpen, setRightPanelOpen,
    viewType, setViewType,
    annotationRefs
  } = useAnnotationData();

  // 3. File Handling Hook
  const {
    files, uploadProgress, uploadMode, setUploadMode,
    handleDrop, handleFileChange, handleUpload, uploadedFiles: newlyUploadedFiles
  } = useFileHandling(taskId, token, setSelectedFileName);

  const allUploadedFiles = useMemo(() => [...taskUploadedFiles, ...newlyUploadedFiles], [taskUploadedFiles, newlyUploadedFiles]);

  // --- Auth & Init ---
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    else if (taskId) fetchTask();
  }, [isAuthenticated, token, taskId, fetchTask, navigate]);

  useEffect(() => {
    if (allUploadedFiles.length > 0 && !selectedFileName) {
      setSelectedFileName(allUploadedFiles[0].originalName);
    }
  }, [allUploadedFiles, selectedFileName, setSelectedFileName]);

  // --- Labels Logic ---
  const [allProjectLabels, setAllProjectLabels] = useState([]);
  useEffect(() => {
    if (taskData && taskData.labels) {
      const formatted = taskData.labels.map(l => ({ value: l.name, label: l.name, color: l.color, type: l.type }));
      setAllProjectLabels(formatted);
    }
  }, [taskData]);

  useEffect(() => {
    const relevant = allProjectLabels.filter(l => !selectedShape || l.type === selectedShape || !l.type);
    setLabelOptions(relevant);
    if (relevant.length > 0 && !relevant.find(l => l.value === selectedLabel)) {
       setSelectedLabel(relevant[0].value);
    }
  }, [selectedShape, allProjectLabels, selectedLabel, setSelectedLabel, setLabelOptions]);

  useEffect(() => {
    const opt = labelOptions.find(o => o.value === selectedLabel);
    if (opt) setBrushColor(opt.color);
  }, [selectedLabel, labelOptions, setBrushColor]);

  const allowedShapeIds = useMemo(() => {
    return (taskData?.labels?.length) ? Array.from(new Set(taskData.labels.map(l => l.type))) : SHAPES.map(s => s.id);
  }, [taskData]);

  const projectAttributes = useMemo(() => taskData?.attributes || [], [taskData]);

  // --- File Switch Logic ---
  const handleFileSwitch = useCallback((newFileName) => {
    if (newFileName === selectedFileName) return;

    // 1. Save current canvas state before switching files
    if (selectedFileName && annotationRefs.current[selectedFileName]?.current) {
      saveSliceAnnotationToState(
        selectedFileName, 
        currentSlice, 
        annotationRefs.current[selectedFileName].current.exportAnnotations()
      );
    }

    // 2. Reset slice controls
    setTotalSlices(0); 
    setCurrentSlice(0);
    
    // 3. Change File
    setSelectedFileName(newFileName);
  }, [selectedFileName, currentSlice, annotationRefs, saveSliceAnnotationToState, setTotalSlices, setCurrentSlice, setSelectedFileName]);


  // -----------------------------------------------------------------------
  // STANDARDIZED SAVING LOGIC
  // -----------------------------------------------------------------------
  const extractStandardData = (fabricObjects) => {
    if (!fabricObjects || !Array.isArray(fabricObjects)) return [];

    return fabricObjects.map(obj => {
      let points = [];
      let type = obj.customType || obj.type;

      if (type === 'polygon' || type === 'polyline') {
        points = (obj.points || []).map(p => {
             return [ p.x + (obj.pathOffset?.x || 0) + obj.left, p.y + (obj.pathOffset?.y || 0) + obj.top ]; 
        });
      } 
      else if (type === 'rect' || type === 'rectangle') {
        type = "rectangle";
        const x = obj.left;
        const y = obj.top;
        const w = obj.width * obj.scaleX;
        const h = obj.height * obj.scaleY;
        points = [ [x, y], [x+w, y], [x+w, y+h], [x, y+h] ];
      }

      return {
        label: obj.label || "Unlabeled",
        type: type,
        points: points, 
        bbox: obj.getBoundingRect ? obj.getBoundingRect() : null
      };
    });
  };

  const handleSaveAll = useCallback(async () => {
    if (!selectedFileName) return;

    try {
      let currentCanvasJson = null;
      if (annotationRefs.current[selectedFileName]?.current) {
        currentCanvasJson = annotationRefs.current[selectedFileName].current.exportAnnotations();
        saveSliceAnnotationToState(selectedFileName, currentSlice, currentCanvasJson);
      }

      const fileAnnotations = annotationsByFileAndSlice[selectedFileName] || {};
      const fileClassifications = classificationByFileAndSlice[selectedFileName] || {};
      const fileInputs = inputsByFileAndSlice[selectedFileName] || {};

      const allActiveSlices = new Set([
        ...Object.keys(fileAnnotations),
        ...Object.keys(fileClassifications),
        ...Object.keys(fileInputs),
        currentSlice.toString()
      ]);

      const slicesPayload = {};

      allActiveSlices.forEach(idx => {
        const editorState = (parseInt(idx) === currentSlice && currentCanvasJson) 
          ? currentCanvasJson 
          : fileAnnotations[idx];

        const standardData = (editorState && editorState.objects) 
          ? extractStandardData(editorState.objects) 
          : [];

        slicesPayload[idx] = {
          editorState: editorState, 
          standardData: standardData,
          classification: fileClassifications[idx] || null,
          attributes: fileInputs[idx] || {}
        };
      });

      await axios.post('http://localhost:5000/save-annotations', {
        taskId,
        filename: selectedFileName,
        sliceData: slicesPayload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(t("Changes Saved Successfully!"));
    } catch (err) {
      console.error("Save failed", err);
      alert(t("Failed to save annotations."));
    }
  }, [selectedFileName, currentSlice, annotationRefs, annotationsByFileAndSlice, classificationByFileAndSlice, inputsByFileAndSlice, taskId, token, saveSliceAnnotationToState, t]);

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading Task...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #f8fafc, #fff)", display: "flex", flexDirection: "column" }}>
      <Header page="tasks" />
      <TaskInfoBar taskData={taskData} files={allUploadedFiles} selectedFileName={selectedFileName} onFileSelect={handleFileSwitch} />
      
      {allUploadedFiles.length === 0 ? (
        <FileUploadSection
          files={files} uploadProgress={uploadProgress} uploadMode={uploadMode} setUploadMode={setUploadMode}
          handleDrop={handleDrop} handleFileChange={handleFileChange}
          handleUpload={() => handleUpload().then(() => fetchTask())} 
        />
      ) : (
        <>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "250px 1fr 250px", gap: "16px", padding: "16px", height: "100%" }}>
            <div style={{ flexBasis: "48px", flexShrink: 0 }}> </div>
            
            <ToolbarLeft
              shapes={SHAPES} allowedShapeIds={allowedShapeIds}
              selectedShape={selectedShape} setSelectedShape={setSelectedShape}
              setToolChangeId={setToolChangeId} sectionIcons={SECTION_ICONS}
              openSection={openSection} setOpenSection={setOpenSection}
            />

            <LeftDrawer
              openSection={openSection} windowCenter={windowCenter} windowWidth={windowWidth}
              setWindowCenter={setWindowCenter} setWindowWidth={setWindowWidth}
              annotationOpacity={annotationOpacity} setAnnotationOpacity={setAnnotationOpacity}
              selectedShape={selectedShape} brushColor={brushColor} setBrushColor={setBrushColor}
              brushSize={brushSize} setBrushSize={setBrushSize}
              selectedLabel={selectedLabel} setSelectedLabel={setSelectedLabel}
              labelOptions={labelOptions} t={t}
            />

            <MainViewer
              uploadedFiles={allUploadedFiles} selectedFileName={selectedFileName}
              windowCenter={windowCenter} windowWidth={windowWidth}
              currentSlice={currentSlice} setCurrentSlice={setCurrentSlice}
              setTotalSlices={setTotalSlices} zoomLevel={zoomLevel} zoomRegion={zoomRegion}
              isZoomMode={isZoomMode} viewType={viewType}
              selectedShape={selectedShape} selectedLabel={selectedLabel}
              brushColor={brushColor} brushSize={brushSize} toolChangeId={toolChangeId}
              annotationOpacity={annotationOpacity}
              classificationByFileAndSlice={classificationByFileAndSlice}
              annotationsByFileAndSlice={annotationsByFileAndSlice}
              saveSliceAnnotationToState={saveSliceAnnotationToState}
              setInputsByFileAndSlice={setInputsByFileAndSlice}
              setClassificationByFileAndSlice={setClassificationByFileAndSlice}
              setAnnotationsByFileAndSlice={setAnnotationsByFileAndSlice}
              annotationRefs={annotationRefs}
              totalSlices={totalSlices}
              taskId={taskId}
            />
          </div>

          <ToolbarRight
            buttons_right={RIGHT_BUTTONS}
            buttons={LEFT_BUTTONS}
            selectedFileName={selectedFileName}
            annotationRefs={annotationRefs}
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
            onSave={handleSaveAll} 
          />

          <RightPanel
            rightPanelOpen={rightPanelOpen} t={t}
            viewType={viewType} setViewType={setViewType}
            selectedFileName={selectedFileName}
            currentSlice={currentSlice} setCurrentSlice={setCurrentSlice}
            classificationByFileAndSlice={classificationByFileAndSlice}
            setClassificationByFileAndSlice={setClassificationByFileAndSlice}
            inputsByFileAndSlice={inputsByFileAndSlice}
            setInputsByFileAndSlice={setInputsByFileAndSlice}
            totalSlices={totalSlices} isZoomMode={isZoomMode} setIsZoomMode={setIsZoomMode}
            zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} zoomRegion={setZoomRegion}
            projectAttributes={projectAttributes} 
          />
        </>
      )}
    </div>
  );
}

export default Annotation;
