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
  
  // Data State Setters
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

  // Initialize Ref for Canvas
  if (file && !annotationRefs.current[file.originalName]) {
    annotationRefs.current[file.originalName] = React.createRef();
  }
  
  const currentCanvasRef = file ? annotationRefs.current[file.originalName] : null;

  // --- 1. LOAD DATA ON FILE CHANGE ---
  useEffect(() => {
    if (!selectedFileName || !token || !taskId) return;

    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/annotations/${taskId}`, {
          params: { fileName: selectedFileName },
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Response structure: { "0": { editorState: {...}, classification: "...", standardData: [...] } }
        const sliceDataMap = response.data || {};
        
        const newAnnotations = {};
        const newInputs = {};
        const newClassifications = {};

        Object.keys(sliceDataMap).forEach(sliceIdx => {
           const sData = sliceDataMap[sliceIdx];
           // Restore Editor State (Fabric JSON)
           if (sData.editorState) newAnnotations[sliceIdx] = sData.editorState;
           // Restore Attributes
           if (sData.attributes) newInputs[sliceIdx] = sData.attributes;
           // Restore Classification
           if (sData.classification) newClassifications[sliceIdx] = sData.classification;
        });

        setAnnotationsByFileAndSlice(prev => ({ ...prev, [selectedFileName]: newAnnotations }));
        setInputsByFileAndSlice(prev => ({ ...prev, [selectedFileName]: newInputs }));
        setClassificationByFileAndSlice(prev => ({ ...prev, [selectedFileName]: newClassifications }));

      } catch (err) {
        console.error("Error loading annotations:", err);
      }
    };

    fetchData();
  }, [selectedFileName, taskId, token]);

  // --- 2. HANDLE SLICE SWITCHING (Save Old -> Load New) ---
  useEffect(() => {
    if (!currentCanvasRef || !currentCanvasRef.current) return;

    const oldSlice = prevSliceRef.current;
    const oldFile = prevFileRef.current;
    
    // Save previous slice to state
    if (oldFile === selectedFileName) {
        const json = currentCanvasRef.current.exportAnnotations();
        saveSliceAnnotationToState(oldFile, oldSlice, json);
    }

    // Clear and Load new slice
    currentCanvasRef.current.clearAnnotations();

    const savedData = annotationsByFileAndSlice[selectedFileName]?.[currentSlice];
    if (savedData) {
      currentCanvasRef.current.importAnnotations(savedData);
    }

    prevSliceRef.current = currentSlice;
    prevFileRef.current = selectedFileName;

  }, [currentSlice, selectedFileName, currentCanvasRef]); 

  if (!file) return null;

  const isDicom = file.type === "dicom";
  const dicomFiles = isDicom ? uploadedFiles.filter((f) => f.type === "dicom") : [];
  const imageIds = dicomFiles.map((f) => `wadouri:${f.url}`);

  const classification = classificationByFileAndSlice[selectedFileName]?.[currentSlice];
  const borderColor = classification === "positive" ? "#16a34a" : classification === "negative" ? "#dc2626" : "#94a3b8";
  const glowColor = classification === "positive" ? "rgba(22,163,74,0.3)" : classification === "negative" ? "rgba(220,38,38,0.3)" : "rgba(148,163,184,0.25)";
  const finalLabel = (selectedLabel && typeof selectedLabel === 'object') ? selectedLabel.name : selectedLabel;

  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ borderRadius: "16px", boxShadow: `0 3px 12px rgba(0,0,0,0.08), 0 0 0 2px ${glowColor}`, position: "relative", border: `1px solid ${borderColor}`, padding: "8px", width: "max-content" }}>
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
              <div style={{ position: "absolute", top: "4px", right: "4px", backgroundColor: borderColor, color: "#fff", padding: "2px 6px", borderRadius: "8px", fontSize: "10px", fontWeight: 600, zIndex: 20 }}>
                {classification}
              </div>
            )}
          </div>
          <div style={{ marginTop: "4px", textAlign: "center", fontSize: "12px" }}>
            Slice {currentSlice + 1} / {isDicom ? imageIds.length : totalSlices}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainViewer;
