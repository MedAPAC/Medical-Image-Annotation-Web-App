// annotation/components/MainViewer.jsx
import React, { useEffect, useRef } from "react";
import axios from "axios";
import NiftiViewer from "../NiftiViewer";
import DicomViewer from "../DicomViewer";
import AnnotationCanvas from "../AnnotationCanvas";
import { useAuth } from "../AuthContext"; 

const MainViewer = ({
  uploadedFiles,
  selectedFileName,
  windowCenter,
  windowWidth,
  currentSlice,
  setCurrentSlice,
  setTotalSlices,
  zoomLevel,
  zoomRegion,
  isZoomMode,
  viewType,
  selectedShape,
  selectedLabel,
  brushColor,
  brushSize,
  toolChangeId,
  annotationOpacity,
  
  // Data State
  classificationByFileAndSlice,
  annotationsByFileAndSlice,
  saveSliceAnnotationToState,
  setInputsByFileAndSlice,
  setClassificationByFileAndSlice,
  setAnnotationsByFileAndSlice,
  
  annotationRefs,
  totalSlices,
  taskId
}) => {
  const { token } = useAuth();
  
  const prevSliceRef = useRef(currentSlice);
  const prevFileRef = useRef(selectedFileName);

  const file = uploadedFiles.find((f) => f.originalName === selectedFileName);

  // Initialize Ref for Canvas if needed
  if (file && !annotationRefs.current[file.originalName]) {
    annotationRefs.current[file.originalName] = React.createRef();
  }
  
  const currentCanvasRef = file ? annotationRefs.current[file.originalName] : null;

  // --- 1. LOAD DATA FROM BACKEND ---
  useEffect(() => {
    if (!selectedFileName || !token || !taskId) return;

    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/annotations/${taskId}`, {
          params: { fileName: selectedFileName },
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const sliceDataMap = response.data || {};
        
        const newAnnotations = {};
        const newInputs = {};
        const newClassifications = {};

        Object.keys(sliceDataMap).forEach(sliceIdx => {
           const sData = sliceDataMap[sliceIdx];
           // Map Backend response to Frontend State
           if (sData.editorState) newAnnotations[sliceIdx] = sData.editorState;
           if (sData.attributes) newInputs[sliceIdx] = sData.attributes;
           if (sData.classification) newClassifications[sliceIdx] = sData.classification;
        });

        // Batch update state
        // We use functional updates to ensure we don't clobber other files if state structure changes
        setAnnotationsByFileAndSlice(prev => ({ ...prev, [selectedFileName]: newAnnotations }));
        setInputsByFileAndSlice(prev => ({ ...prev, [selectedFileName]: newInputs }));
        setClassificationByFileAndSlice(prev => ({ ...prev, [selectedFileName]: newClassifications }));

      } catch (err) {
        console.error("Error loading annotations:", err);
      }
    };

    fetchData();
  }, [selectedFileName, taskId, token, setAnnotationsByFileAndSlice, setInputsByFileAndSlice, setClassificationByFileAndSlice]);


  // --- 2. HANDLE CANVAS SYNC (Slice Switch OR Data Load) ---
  // Get the specific data for the current slice from the global store
  const currentSliceData = annotationsByFileAndSlice[selectedFileName]?.[currentSlice];

  useEffect(() => {
    if (!currentCanvasRef || !currentCanvasRef.current) return;

    const canvas = currentCanvasRef.current;
    const oldSlice = prevSliceRef.current;
    const oldFile = prevFileRef.current;
    
    // A. If we are switching slices/files, SAVE the previous one first
    // Note: We only save if it's the SAME file (switching slices) or if we are handling a file switch cleanup
    // But usually file switch cleanup is handled in parent. Here we focus on Slice Switch.
    if (oldFile === selectedFileName && oldSlice !== currentSlice) {
        const json = canvas.exportAnnotations();
        // Don't save if empty? Or save empty to clear? 
        // Better to save whatever is there to preserve state.
        saveSliceAnnotationToState(oldFile, oldSlice, json);
    }

    // B. LOAD the new slice data
    // We do this if the slice changed, the file changed, OR if data just arrived from the backend (currentSliceData changed)
    
    // Clear first to prevent ghosts
    canvas.clearAnnotations(); 
    
    if (currentSliceData) {
      canvas.importAnnotations(currentSliceData);
    }

    // Update refs
    prevSliceRef.current = currentSlice;
    prevFileRef.current = selectedFileName;

  }, [
    currentSlice, 
    selectedFileName, 
    currentCanvasRef, 
    currentSliceData, // CRITICAL: This triggers the reload when API data returns!
    saveSliceAnnotationToState
  ]); 


  if (!file) return null;

  const isDicom = file.type === "dicom";
  const dicomFiles = isDicom ? uploadedFiles.filter((f) => f.type === "dicom") : [];
  const imageIds = dicomFiles.map((f) => `wadouri:${f.url}`);

  const classification = classificationByFileAndSlice[selectedFileName]?.[currentSlice];
  
  // Visual feedback for classification
  const borderColor = classification === "positive" ? "#16a34a" : classification === "negative" ? "#dc2626" : "#e2e8f0";
  const glowColor = classification === "positive" ? "rgba(22,163,74,0.3)" : classification === "negative" ? "rgba(220,38,38,0.3)" : "rgba(0,0,0,0.05)";
  const finalLabel = (selectedLabel && typeof selectedLabel === 'object') ? selectedLabel.name : selectedLabel;

  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ borderRadius: "16px", boxShadow: `0 3px 12px rgba(0,0,0,0.08), 0 0 0 4px ${glowColor}`, position: "relative", border: `2px solid ${borderColor}`, padding: "8px", width: "max-content", transition: "all 0.3s ease" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            
            {isDicom ? (
              <DicomViewer
                imageIds={imageIds}
                windowCenter={windowCenter} windowWidth={windowWidth}
                currentSlice={currentSlice} onSliceChange={setCurrentSlice}
                setTotalSlices={setTotalSlices} zoomLevel={zoomLevel} zoomRegion={zoomRegion}
                isZoomMode={isZoomMode} viewType={viewType}
                style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <NiftiViewer
                url={file.url}
                windowCenter={windowCenter} windowWidth={windowWidth}
                currentSlice={currentSlice} onSliceChange={setCurrentSlice}
                setTotalSlices={setTotalSlices} isZoomMode={isZoomMode}
                zoomRegion={zoomRegion} zoomLevel={zoomLevel} viewType={viewType}
                style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
              />
            )}

            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
              <AnnotationCanvas
                ref={currentCanvasRef}
                mode={selectedShape}
                width={500} height={500}
                selectedLabel={finalLabel}
                brushColor={brushColor} brushSize={brushSize}
                toolChangeId={toolChangeId} annotationOpacity={annotationOpacity}
              />
            </div>

            {classification && (
              <div style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: borderColor, color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", zIndex: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                {classification.toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ marginTop: "8px", textAlign: "center", fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
            Slice {currentSlice + 1} / {isDicom ? imageIds.length : totalSlices}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainViewer;
