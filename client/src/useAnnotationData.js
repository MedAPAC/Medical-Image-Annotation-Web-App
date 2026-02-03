// annotation/hooks/useAnnotationData.js
import { useState, useRef, useEffect } from "react";

const useAnnotationData = () => {
  // --- Tool States ---
  const [selectedShape, setSelectedShape] = useState("");
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [labelOptions, setLabelOptions] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState(null);

  // --- Display Settings ---
  const [windowCenter, setWindowCenter] = useState(null);
  const [windowWidth, setWindowWidth] = useState(null);
  const [brushColor, setBrushColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(10);
  const [toolChangeId, setToolChangeId] = useState(0);
  const [annotationOpacity, setAnnotationOpacity] = useState(0.5);

  // --- UI States ---
  const [openSection, setOpenSection] = useState(null);
  const [totalSlices, setTotalSlices] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [zoomRegion, setZoomRegion] = useState(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(null);
  const [viewType, setViewType] = useState("axial");
  const [currentSlice, setCurrentSlice] = useState(0);

  // --- DATA STATES (The "Database" in Frontend Memory) ---
  // Key structure: { [fileName]: { [sliceIndex]: Data } }
  
  const [inputsByFileAndSlice, setInputsByFileAndSlice] = useState({});
  const [classificationByFileAndSlice, setClassificationByFileAndSlice] = useState({});
  const [annotationsByFileAndSlice, setAnnotationsByFileAndSlice] = useState({});

  // Refs for Canvas interaction
  const annotationRefs = useRef({});

  // --- Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFileName) return;
      // Prevent slice change if user is typing
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === "ArrowRight") {
        setCurrentSlice((prev) => Math.min(prev + 1, totalSlices - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlice((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFileName, totalSlices]);

  // --- Helpers ---

  // Helper to save Canvas JSON to state (In-Memory)
  const saveSliceAnnotationToState = (fileName, sliceIndex, canvasJson) => {
    setAnnotationsByFileAndSlice(prev => ({
      ...prev,
      [fileName]: {
        ...(prev[fileName] || {}),
        [sliceIndex]: canvasJson
      }
    }));
  };

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
    
    // Data Props
    inputsByFileAndSlice, setInputsByFileAndSlice,
    classificationByFileAndSlice, setClassificationByFileAndSlice,
    annotationsByFileAndSlice, setAnnotationsByFileAndSlice, 
    saveSliceAnnotationToState, 
    
    currentSlice, setCurrentSlice,
    rightPanelOpen, setRightPanelOpen,
    viewType, setViewType,
    annotationRefs
  };
};

export default useAnnotationData;
