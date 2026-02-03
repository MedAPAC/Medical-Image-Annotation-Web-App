// hooks/useAnnotationData.js
import { useState, useRef, useEffect, useCallback } from "react";

const useAnnotationData = () => {
  // --- Tool & UI States ---
  const [selectedShape, setSelectedShape] = useState(null); 
  const [selectedLabel, setSelectedLabel] = useState(null); 
  const [labelOptions, setLabelOptions] = useState([]); 
  const [selectedFileName, setSelectedFileName] = useState(null);
  
  // --- Window / DICOM Settings ---
  const [windowCenter, setWindowCenter] = useState(null);
  const [windowWidth, setWindowWidth] = useState(null);
  
  // --- Drawing Settings ---
  const [brushColor, setBrushColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(10);
  const [toolChangeId, setToolChangeId] = useState(0);
  const [annotationOpacity, setAnnotationOpacity] = useState(0.5);
  
  // --- Viewer States ---
  const [openSection, setOpenSection] = useState(null);
  const [totalSlices, setTotalSlices] = useState(0); // Initialize as 0
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [zoomRegion, setZoomRegion] = useState(null);
  
  // --- Data States ---
  const [inputsByFileAndSlice, setInputsByFileAndSlice] = useState({});
  const [classificationByFileAndSlice, setClassificationByFileAndSlice] = useState({});
  const [annotationsByFileAndSlice, setAnnotationsByFileAndSlice] = useState({});
  
  const [currentSlice, setCurrentSlice] = useState(0);
  
  // --- Layout States ---
  const [rightPanelOpen, setRightPanelOpen] = useState(null);
  const [viewType, setViewType] = useState("axial");
  
  const annotationRefs = useRef({});

  // --- Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFileName) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === "ArrowRight") {
        setCurrentSlice((prev) => (totalSlices > 0 ? Math.min(prev + 1, totalSlices - 1) : 0));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlice((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFileName, totalSlices]);

  // --- HELPER FUNCTIONS (Wrapped in useCallback) ---

  const getInputsForCurrent = useCallback((fileName, slice) => {
    return inputsByFileAndSlice[fileName]?.[slice] || {
      checkbox: false, number: "", text: "", radio: "", select: ""
    };
  }, [inputsByFileAndSlice]);

  const updateInputsForCurrent = useCallback((fileName, slice, updates) => {
    setInputsByFileAndSlice((prev) => ({
      ...prev,
      [fileName]: {
        ...(prev[fileName] || {}),
        [slice]: { ...(prev[fileName]?.[slice] || {}), ...updates },
      },
    }));
  }, []);

  const saveSliceAnnotationToState = useCallback((fileName, sliceIndex, canvasRef) => {
    if (!fileName || !canvasRef) return;
    const json = canvasRef.exportAnnotations ? canvasRef.exportAnnotations() : null;
    if (!json) return;

    setAnnotationsByFileAndSlice(prev => ({
      ...prev,
      [fileName]: {
        ...(prev[fileName] || {}),
        [sliceIndex]: json
      }
    }));
  }, []);

  return {
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
    inputsByFileAndSlice, setInputsByFileAndSlice,
    classificationByFileAndSlice, setClassificationByFileAndSlice,
    annotationsByFileAndSlice, setAnnotationsByFileAndSlice,
    rightPanelOpen, setRightPanelOpen,
    viewType, setViewType,
    annotationRefs,
    getInputsForCurrent,
    updateInputsForCurrent,
    saveSliceAnnotationToState
  };
};

export default useAnnotationData;
